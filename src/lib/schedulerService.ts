import { getBase, TABLE_APPOINTMENT_REQUESTS, TABLE_APPOINTMENTS, TABLE_TRIAGE_RESULTS, TABLE_PATIENTS } from "./airtable";
import { triageSymptoms, Urgency } from "./triageEngine";
import { getPendingRequestsBatch, createTriageResult, createAppointment, updateRequestScheduledAtomic, destroyAppointment, destroyTriageResult, hasAppointmentForRequest } from "./dataAccess";

const base = getBase();

export async function processPendingRequests() {
  console.log("Checking for pending requests...");
  await reconcilePendingWithAppointments();
  const pendingRequests = await getPendingRequestsBatch(10);

  console.log(`Found ${pendingRequests.length} pending requests.`);
  const results = [];

  for (const record of pendingRequests) {
    try {
      const requestId = record.id;
      const symptoms = record.fields.Symptoms as string;
      const requestedSpecialty = record.fields.Specialty as string;
      const patientId = (record.fields.Patient as string[])?.[0];
      const existingAppointment = (record.fields.Appointment as string[]) || [];
      const status = record.fields.Status as string;
      if (status !== "Pending" || existingAppointment.length > 0) {
        continue;
      }

      console.log(`Processing request ${requestId}...`);

      let name = "";
      let email = "";
      let phone = "";
      if (patientId) {
        try {
          const p = await base(TABLE_PATIENTS).find(patientId);
          name = String(p.fields.Name || "");
          email = String(p.fields.Email || "");
          phone = String(p.fields.Phone || "");
        } catch {}
      }
      const triage = await triageSymptoms({
        name,
        email,
        phone,
        symptoms,
        preferredDate: String(record.fields.PreferredDate || ""),
        specialty: requestedSpecialty || ""
      });
      console.log(`Triage Result:`, triage);
      
      const targetDepartment = requestedSpecialty || triage.department;

      const triageRecordId = await createTriageResult(requestId, triage);

      // 2. Determine Target Date based on Urgency
      const targetDate = getTargetDate(triage.urgency);
      
      // 3. Find Slot (prevent double-booking)
      const appointmentTime = await findNextAvailableSlot(targetDate, targetDepartment);

      const appointmentId = await createAppointment({
        patientId,
        requestId,
        department: targetDepartment,
        startIso: appointmentTime.toISOString(),
        urgency: triage.urgency
      });

      const scheduledAtIso = new Date().toISOString();
      const ok = await updateRequestScheduledAtomic(requestId, triageRecordId, appointmentId, scheduledAtIso, "System");
      if (!ok) {
        await destroyAppointment(appointmentId);
        await destroyTriageResult(triageRecordId);
        throw new Error("Atomic status update failed; rolled back appointment and triage result");
      }

      results.push({
        requestId,
        status: "Scheduled",
        time: appointmentTime,
        department: targetDepartment,
        triage
      });
      console.log(`Successfully scheduled request ${requestId} at ${appointmentTime}`);
    } catch (err: unknown) {
      console.error(`Error processing request ${record.id}:`, err);
    }
  }

  return results;
}

function getTargetDate(urgency: Urgency): Date {
  const now = new Date();
  switch (urgency) {
    case "Critical":
      return now; // Today
    case "High":
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    case "Medium":
      return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 Days
    case "Low":
    default:
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Next available/week
  }
}


async function findNextAvailableSlot(targetDate: Date, department: string): Promise<Date> {
  let dateCursor = new Date(targetDate);
  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const dayStr = dateCursor.toISOString().slice(0, 10); // YYYY-MM-DD
    const dayAppointments = await base(TABLE_APPOINTMENTS).select({
      filterByFormula: `IS_SAME({StartTime}, DATETIME_PARSE('${dayStr}', 'YYYY-MM-DD'), 'day')`,
      fields: ["StartTime"],
      maxRecords: 100
    }).all();
    const busyKeys = new Set(
      dayAppointments
        .map(a => new Date(a.fields.StartTime as string))
        .map(d => `${d.getHours()}-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`)
    );
    for (let hour = 9; hour <= 16; hour++) {
      const candidate = new Date(dayStr + "T00:00:00Z");
      candidate.setHours(hour, 0, 0, 0);
      const key = `${candidate.getHours()}-${candidate.getFullYear()}-${candidate.getMonth()}-${candidate.getDate()}`;
      if (!busyKeys.has(key) && candidate > new Date()) {
        return candidate;
      }
    }
    // Move to next day and try again
    dateCursor = new Date(dateCursor.getTime() + 24 * 60 * 60 * 1000);
  }
  // Fallback: next hour from now
  const fallback = new Date();
  fallback.setTime(Date.now() + 60 * 60 * 1000);
  return fallback;
}

async function reconcilePendingWithAppointments() {
  try {
    const pending = await base(TABLE_APPOINTMENT_REQUESTS).select({
      filterByFormula: `{Status} = 'Pending'`,
      fields: ["Status"],
      maxRecords: 50
    }).all();
    const toUpdate = [];
    for (const r of pending) {
      const has = await hasAppointmentForRequest(r.id);
      if (has) {
        toUpdate.push({ id: r.id, fields: { Status: "Scheduled" } });
      }
    }
    if (toUpdate.length > 0) {
      await base(TABLE_APPOINTMENT_REQUESTS).update(toUpdate);
      console.log(`Reconciled ${toUpdate.length} pending requests with existing appointments.`);
    }
  } catch (e) {
    console.error("Reconciliation failed:", e);
  }
}
