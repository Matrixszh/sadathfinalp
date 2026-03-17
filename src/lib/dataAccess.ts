import { getBase, TABLE_APPOINTMENT_REQUESTS, TABLE_APPOINTMENTS, TABLE_TRIAGE_RESULTS, TABLE_DOCTORS } from "./airtable";

const base = getBase();

export async function getPendingRequestsBatch(limit: number) {
  return base(TABLE_APPOINTMENT_REQUESTS).select({
    filterByFormula: `{Status} = 'Pending'`,
    maxRecords: limit
  }).all();
}

export async function hasAppointmentForRequest(requestId: string) {
  const appts = await base(TABLE_APPOINTMENTS).select({
    filterByFormula: `SEARCH('${requestId}', ARRAYJOIN({Request}))`,
    fields: ["Request"],
    maxRecords: 1
  }).all();
  return appts.length > 0;
}

export async function createTriageResult(requestId: string, triage: { department: string; urgency: string; confidence: number; reasoning: string; }) {
  const created = await base(TABLE_TRIAGE_RESULTS).create([
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
  return created[0].id;
}

export async function createAppointment(payload: { patientId?: string; requestId: string; department: string; startIso: string; urgency: string; }) {
  const created = await base(TABLE_APPOINTMENTS).create([
    {
      fields: {
        Patient: payload.patientId ? [payload.patientId] : undefined,
        Request: [payload.requestId],
        Department: payload.department,
        StartTime: payload.startIso,
        Status: "Confirmed",
        Urgency: payload.urgency
      }
    }
  ], { typecast: true });
  return created[0].id;
}

export async function updateRequestScheduledAtomic(requestId: string, triageRecordId: string, appointmentId: string, scheduledAtIso: string, scheduledBy: string) {
  const record = await base(TABLE_APPOINTMENT_REQUESTS).find(requestId);
  const status = record.fields.Status as string;
  const existing = await hasAppointmentForRequest(requestId);
  if (status !== "Pending" || existing) {
    return false;
  }
  await base(TABLE_APPOINTMENT_REQUESTS).update([
    {
      id: requestId,
      fields: {
        Status: "Scheduled"
      }
    }
  ], { typecast: true });
  return true;
}

export async function destroyAppointment(appointmentId: string) {
  await base(TABLE_APPOINTMENTS).destroy([appointmentId]);
}

export async function destroyTriageResult(triageId: string) {
  await base(TABLE_TRIAGE_RESULTS).destroy([triageId]);
}

export async function listActiveDoctorsBySpecialty(specialty: string) {
  return base(TABLE_DOCTORS).select({
    filterByFormula: `AND({Specialty} = '${specialty}', {Status} = 'Active')`,
    fields: ["Name", "Specialty", "Email", "Phone", "Status"],
    maxRecords: 100
  }).all();
}

export async function computeDoctorLoad(doctorId: string, fromIso?: string) {
  const startIso = fromIso || new Date().toISOString();
  const appts = await base(TABLE_APPOINTMENTS).select({
    fields: ["StartTime", "Status", "Doctor"],
    maxRecords: 500
  }).all();
  const start = Date.parse(startIso);
  return appts.filter(a => {
    const f = a.fields as any;
    const linkedDoctors = (f.Doctor as string[]) || [];
    if (!linkedDoctors.includes(doctorId)) return false;
    const status = String(f.Status || "");
    if (status === "Cancelled") return false;
    const t = f.StartTime ? Date.parse(String(f.StartTime)) : NaN;
    if (Number.isNaN(t)) return true;
    return t >= start;
  }).length;
}

export async function pickDoctorByLoad(specialty: string) {
  // Normalize department-to-specialty mapping
  const mapped = normalizeSpecialtyForDoctor(specialty);
  let docs = await listActiveDoctorsBySpecialty(mapped);
  // Fallback: allow any doctor with the specialty if none active
  if (docs.length === 0) {
    docs = await base(TABLE_DOCTORS).select({
      filterByFormula: `{Specialty} = '${mapped}'`,
      fields: ["Name", "Specialty", "Email", "Status"],
      maxRecords: 100
    }).all();
    if (docs.length === 0) return null;
  }
  const loads: Array<{ id: string; load: number }> = [];
  for (const d of docs) {
    const l = await computeDoctorLoad(d.id);
    loads.push({ id: d.id, load: l });
  }
  loads.sort((a, b) => a.load - b.load);
  return loads[0].id;
}

export function normalizeSpecialtyForDoctor(department: string): string {
  switch ((department || "").trim()) {
    case "General Medicine":
      return "General Practice";
    default:
      return department;
  }
}
