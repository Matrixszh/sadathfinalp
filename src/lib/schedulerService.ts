import { getBase, TABLE_APPOINTMENT_REQUESTS, TABLE_APPOINTMENTS, TABLE_TRIAGE_RESULTS } from "./airtable";
import { triageSymptoms, Urgency } from "./triageEngine";

const base = getBase();

export async function processPendingRequests() {
  console.log("Checking for pending requests...");
  await reconcilePendingWithAppointments();
  const pendingRequests = await base(TABLE_APPOINTMENT_REQUESTS).select({
    filterByFormula: `{Status} = 'Pending'`,
    maxRecords: 10 // Process in batches
  }).all();

  console.log(`Found ${pendingRequests.length} pending requests.`);
  const results = [];

  for (const record of pendingRequests) {
    try {
      const requestId = record.id;
      const symptoms = record.fields.Symptoms as string;
      const requestedSpecialty = record.fields.Specialty as string;
      const patientId = (record.fields.Patient as string[])?.[0];

      console.log(`Processing request ${requestId}...`);

      // 1. Triage
      const triage = await triageSymptoms(symptoms);
      console.log(`Triage Result:`, triage);
      
      const targetDepartment = requestedSpecialty || triage.department;

      // Save Triage Result
      const triageRecord = await base(TABLE_TRIAGE_RESULTS).create([
        {
          fields: {
            Request: [requestId],
            Department: triage.department,
            Urgency: triage.urgency,
            Confidence: triage.confidence,
            Reasoning: triage.reasoning
          }
        }
      ], { typecast: true });

      // 2. Determine Target Date based on Urgency
      const targetDate = getTargetDate(triage.urgency);
      
      // 3. Find Slot (prevent double-booking)
      const appointmentTime = await findNextAvailableSlot(targetDate, targetDepartment);

      // 4. Create Appointment
      const appointment = await base(TABLE_APPOINTMENTS).create([
        {
          fields: {
            Patient: patientId ? [patientId] : undefined, // Handle missing patient ID safely
            Request: [requestId],
            Department: targetDepartment,
            StartTime: appointmentTime.toISOString(),
            Status: "Confirmed",
            Urgency: triage.urgency
          }
        }
      ], { typecast: true });

      // 5. Update Request Status
      await base(TABLE_APPOINTMENT_REQUESTS).update([
        {
          id: requestId,
          fields: {
            Status: "Scheduled",
            TriageResult: [triageRecord[0].id],
            Appointment: [appointment[0].id]
          }
        }
      ], { typecast: true });

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
    const toFix = await base(TABLE_APPOINTMENT_REQUESTS).select({
      filterByFormula: `AND({Status} = 'Pending', ARRAYJOIN({Appointment}) != '')`,
      fields: ["Status", "Appointment"],
      maxRecords: 50
    }).all();
    if (toFix.length > 0) {
      await base(TABLE_APPOINTMENT_REQUESTS).update(
        toFix.map(r => ({ id: r.id, fields: { Status: "Scheduled" } }))
      );
      console.log(`Reconciled ${toFix.length} pending requests with existing appointments.`);
    }
  } catch (e) {
    console.error("Reconciliation failed:", e);
  }
}
