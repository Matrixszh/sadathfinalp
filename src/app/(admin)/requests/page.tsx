import { getBase, TABLE_APPOINTMENT_REQUESTS, TABLE_PATIENTS } from "@/lib/airtable";
import { User, Clock, FileText } from "lucide-react";
import AutoScheduler from "@/components/AutoScheduler";

export const revalidate = 0;

export default async function RequestsPage() {
  const base = getBase();
  const records = await base(TABLE_APPOINTMENT_REQUESTS).select({
    sort: [{ field: "SubmittedAt", direction: "desc" }]
  }).all();

  const patientIds = Array.from(new Set(records.flatMap(r => (r.fields.Patient as string[]) || [])));
  const patientNameById: Record<string, string> = {};
  await Promise.all(patientIds.map(async (id) => {
    try {
      const p = await base(TABLE_PATIENTS).find(id);
      patientNameById[id] = String(p.fields.Name || "");
    } catch {}
  }));

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Intake Requests</h1>
          <p className="text-gray-500">Patient submissions pending triage or scheduling.</p>
        </div>
        <AutoScheduler intervalMs={30000} />
      </div>

      <div className="grid gap-4">
        {records.map((record) => {
          const fields = record.fields;
          const date = new Date(fields.SubmittedAt as string);
          const pid = ((fields.Patient as string[])?.[0] || "");
          const pname = patientNameById[pid] || `Patient ${pid.slice(-4)}`;
          
          return (
            <div key={record.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{pname}</h3>
                    <p className="text-xs text-gray-500">Request #{record.id.slice(-4)}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {date.toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  fields.Status === "Pending" ? "bg-blue-100 text-blue-700" :
                  fields.Status === "Scheduled" ? "bg-green-100 text-green-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {fields.Status as string}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Symptoms
                  </p>
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {fields.Symptoms as string}
                  </p>
                </div>
                
                <div className="flex gap-4 text-sm text-gray-600">
                  <div>
                    <span className="text-gray-400 mr-2">Preferred Date:</span>
                    {fields.PreferredDate as string}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {records.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
            No pending requests.
          </div>
        )}
      </div>
    </div>
  );
}
