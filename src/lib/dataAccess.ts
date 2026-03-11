import { getBase, TABLE_APPOINTMENT_REQUESTS, TABLE_APPOINTMENTS, TABLE_TRIAGE_RESULTS } from "./airtable";

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
