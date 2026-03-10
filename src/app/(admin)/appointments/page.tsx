import { getBase, TABLE_APPOINTMENTS, TABLE_PATIENTS } from "@/lib/airtable";
import { Calendar, User, Clock, ShieldAlert } from "lucide-react";

export const revalidate = 0;

export default async function AppointmentsPage() {
  const base = getBase();
  const records = await base(TABLE_APPOINTMENTS).select({
    sort: [{ field: "StartTime", direction: "asc" }]
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
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500">Scheduled patient consultations.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-medium text-gray-500">Patient</th>
              <th className="px-6 py-4 font-medium text-gray-500">Department</th>
              <th className="px-6 py-4 font-medium text-gray-500">Date & Time</th>
              <th className="px-6 py-4 font-medium text-gray-500">Urgency</th>
              <th className="px-6 py-4 font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.map((record) => {
              const fields = record.fields;
              const date = new Date(fields.StartTime as string);
              const urgency = fields.Urgency as string;
              
              return (
                <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-gray-900">
                        {patientNameById[((fields.Patient as string[])?.[0] || "")] || `Patient ${(((fields.Patient as string[])?.[0] || "").slice(-4))}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{fields.Department as string}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-900">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {date.toLocaleDateString()}
                      <Clock className="w-4 h-4 text-gray-400 ml-2" />
                      {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      urgency === "Critical" ? "bg-red-100 text-red-700" :
                      urgency === "High" ? "bg-orange-100 text-orange-700" :
                      urgency === "Medium" ? "bg-yellow-100 text-yellow-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {urgency === "Critical" && <ShieldAlert className="w-3 h-3" />}
                      {urgency}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                      {fields.Status as string}
                    </span>
                  </td>
                </tr>
              );
            })}
            {records.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No appointments scheduled.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
