 "use client";
import { Calendar, User, Clock, ShieldAlert, Plus, Edit2, Trash2, Search } from "lucide-react";
import { useEffect, useState } from "react";


type Appointment = {
  id: string;
  Patient?: string[];
  Request?: string[];
  Department?: string;
  StartTime?: string;
  Status?: string;
  Urgency?: string;
  patientName?: string;
};

function AppointmentsClient() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [department, setDepartment] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({ department: "", startTime: "", status: "Confirmed", urgency: "Medium" });
  const [editing, setEditing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ q, status, department, page: String(page), pageSize: String(pageSize) });
    const res = await fetch(`/api/appointments?${params.toString()}`);
    const data = await res.json();
    setItems(data.data || []);
    setTotal(data.total || 0);
    setLoading(false);
  }

  useEffect(() => { load(); }, [q, status, department, page, pageSize]);

  async function save() {
    if (!form.department || !form.startTime) return alert("Department and Start Time are required");
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/appointments/${editing}` : "/api/appointments";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (!res.ok) return alert("Save failed");
    setForm({ department: "", startTime: "", status: "Confirmed", urgency: "Medium" });
    setEditing(null);
    load();
  }

  async function remove(id: string, soft = true) {
    if (!confirm(soft ? "Cancel this appointment?" : "Permanently delete appointment?")) return;
    const res = await fetch(`/api/appointments/${id}?soft=${soft}`, { method: "DELETE" });
    if (!res.ok) return alert("Delete failed");
    load();
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500">Scheduled patient consultations.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border rounded-md px-2 py-1">
            <Search className="w-4 h-4 text-gray-500" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search department..." className="outline-none text-sm" />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)} className="px-2 py-1 border rounded-md bg-white text-sm">
            <option value="">All Status</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select value={department} onChange={e => setDepartment(e.target.value)} className="px-2 py-1 border rounded-md bg-white text-sm">
            <option value="">All Departments</option>
            <option>General Medicine</option>
            <option>Cardiology</option>
            <option>Neurology</option>
            <option>Orthopedics</option>
            <option>Dermatology</option>
          </select>
        </div>
      </div>

      <div className="bg-white p-4 border rounded-xl space-y-3">
        <h2 className="font-semibold">Create / Edit Appointment</h2>
        <div className="grid md:grid-cols-4 gap-2">
          <input className="border rounded-md px-2 py-1" placeholder="Department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
          <input className="border rounded-md px-2 py-1" type="datetime-local" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
          <select className="border rounded-md px-2 py-1 bg-white" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option>Confirmed</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>
          <select className="border rounded-md px-2 py-1 bg-white" value={form.urgency} onChange={e => setForm({ ...form, urgency: e.target.value })}>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="px-3 py-2 bg-blue-600 text-white rounded-md">{editing ? "Update" : "Create"}</button>
          {editing && <button onClick={() => { setEditing(null); setForm({ department: "", startTime: "", status: "Confirmed", urgency: "Medium" }); }} className="px-3 py-2 bg-gray-100 rounded-md">Cancel</button>}
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
              <th className="px-6 py-4 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => {
              const date = item.StartTime ? new Date(item.StartTime) : null;
              const urgency = item.Urgency as string;
              
              return (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-gray-900">{item.patientName || `Patient ${(item.Patient?.[0] || "").slice(-4)}`}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{item.Department as string}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-900">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {date ? date.toLocaleDateString() : "-"}
                      <Clock className="w-4 h-4 text-gray-400 ml-2" />
                      {date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
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
                      {item.Status as string}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditing(item.id); setForm({ department: item.Department || "", startTime: item.StartTime ? item.StartTime.slice(0,16) : "", status: item.Status || "Confirmed", urgency: item.Urgency || "Medium" }); }} className="p-2 hover:bg-blue-50 rounded-md text-blue-600"><Edit2 size={16} /></button>
                      <button onClick={() => remove(item.id, true)} className="p-2 hover:bg-yellow-50 rounded-md text-yellow-600" title="Soft delete"><Trash2 size={16} /></button>
                      <button onClick={() => remove(item.id, false)} className="p-2 hover:bg-red-50 rounded-md text-red-600" title="Hard delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No appointments scheduled.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between p-4">
          <div className="text-sm text-gray-600">Total: {total}</div>
          <div className="flex items-center gap-2">
            <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-2 py-1 border rounded">Prev</button>
            <span className="text-sm">Page {page}</span>
            <button disabled={(page*pageSize)>=total} onClick={()=>setPage(p=>p+1)} className="px-2 py-1 border rounded">Next</button>
            <select value={pageSize} onChange={e=>setPageSize(parseInt(e.target.value))} className="px-2 py-1 border rounded bg-white text-sm">
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AppointmentsPage() {
  return <AppointmentsClient />;
}
