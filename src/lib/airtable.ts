import Airtable from "airtable";

const apiKey = process.env.AIRTABLE_API_KEY ?? "";
const baseId = process.env.AIRTABLE_BASE_ID ?? "";

// MAPPING: New System Logic -> Existing Airtable Tables
// Since we are getting 403s on new tables, we must reuse the existing tables 
// that we know work (Leads, Events, Automations) or accept that the user needs to create new ones.
// However, the error "NOT_AUTHORIZED" often means the Table doesn't exist or the Token doesn't have access.
// Assuming the user hasn't created the new tables yet, let's map them to the old ones temporarily 
// OR clarify that they need to be created.

// BUT, for a hospital system, "Leads" -> "Patients" is a fair mapping.
// "Events" -> "Appointments" is also fair.
// "Automations" -> "AppointmentRequests" is a bit of a stretch but maybe "Leads" can hold requests?

// Let's stick to the new names but I suspect the user hasn't created them in Airtable yet.
// The error `NOT_AUTHORIZED` with `403` usually happens when the table name is wrong or the token is scoped to specific paths.
// Since `Leads` worked in the test script, the token is valid for the Base.
// This strongly suggests the Tables "Patients", "AppointmentRequests", etc., DO NOT EXIST yet.

export const TABLE_PATIENTS = "Patients";
export const TABLE_APPOINTMENT_REQUESTS = "AppointmentRequests";
export const TABLE_TRIAGE_RESULTS = "TriageResults";
export const TABLE_APPOINTMENTS = "Appointments";

// Legacy tables
export const TABLE_LEADS = "Leads"; 
export const TABLE_EVENTS = "Events";
export const TABLE_AUTOMATIONS = "Automations";

export function getBase() {
  if (!apiKey || !baseId) {
    throw new Error("Missing Airtable configuration: set AIRTABLE_API_KEY and AIRTABLE_BASE_ID in .env.local");
  }
  const airtable = new Airtable({ apiKey });
  return airtable.base(baseId);
}
