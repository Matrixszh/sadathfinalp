 "use client";
import { User, Clock, FileText, Search, Edit2, Trash2, Plus } from "lucide-react";
import RunSchedulerButton from "@/components/RunSchedulerButton";
import { useEffect, useState } from "react";


type RequestItem = {
  id: string;
  Patient?: string[];
  Symptoms?: string;
  PreferredDate?: string;
  Status?: string;
  Specialty?: string;
  SubmittedAt?: string;
};

function RequestsClient() {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({ symptoms: "", preferredDate: "", specialty: "" , status: "Pending"});
  const [editing, setEditing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ q, status, page: String(page), pageSize: String(pageSize) });
    const res = await fetch(`/api/requests?${params.toString()}`);
    const data = await res.json();
    setItems(data.data || []);
    setTotal(data.total || 0);
    setLoading(false);
  }

  useEffect(() => { load(); }, [q, status, page, pageSize]);

  async function save() {
    if (!form.symptoms) return alert("Symptoms are required");
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/requests/${editing}` : "/api/requests";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (!res.ok) return alert("Save failed");
    setForm({ symptoms: "", preferredDate: "", specialty: "", status: "Pending" });
    setEditing(null);
    load();
  }

  async function remove(id: string, soft = true) {
    if (!confirm(soft ? "Cancel this request?" : "Permanently delete request?")) return;
    const res = await fetch(`/api/requests/${id}?soft=${soft}`, { method: "DELETE" });
    if (!res.ok) return alert("Delete failed");
    load();
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Intake Requests</h1>
          <p className="text-gray-500">Patient submissions pending triage or scheduling.</p>
        </div>
        <RunSchedulerButton />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border rounded-md px-2 py-1">
            <Search className="w-4 h-4 text-gray-500" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search symptoms..." className="outline-none text-sm" />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)} className="px-2 py-1 border rounded-md bg-white text-sm">
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white p-4 border rounded-xl space-y-3">
        <h2 className="font-semibold">Create / Edit Request</h2>
        <div className="grid md:grid-cols-4 gap-2">
          <input className="border rounded-md px-2 py-1" placeholder="Symptoms" value={form.symptoms} onChange={e => setForm({ ...form, symptoms: e.target.value })} />
          <input className="border rounded-md px-2 py-1" type="date" value={form.preferredDate} onChange={e => setForm({ ...form, preferredDate: e.target.value })} />
          <input className="border rounded-md px-2 py-1" placeholder="Specialty (optional)" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} />
          <select className="border rounded-md px-2 py-1 bg-white" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option>Pending</option>
            <option>Scheduled</option>
            <option>Cancelled</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="px-3 py-2 bg-blue-600 text-white rounded-md">{editing ? "Update" : "Create"}</button>
          {editing && <button onClick={() => { setEditing(null); setForm({ symptoms: "", preferredDate: "", specialty: "", status: "Pending" }); }} className="px-3 py-2 bg-gray-100 rounded-md">Cancel</button>}
        </div>
      </div>

      <div className="grid gap-4">
        {items.map((item) => {
          const date = item.SubmittedAt ? new Date(item.SubmittedAt) : null;
          const pid = ((item.Patient as string[])?.[0] || "");
          const pname = pid ? `Patient ${pid.slice(-4)}` : "Patient";
          
          return (
            <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{pname}</h3>
                    <p className="text-xs text-gray-500">Request #{item.id.slice(-4)}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {date ? date.toLocaleString() : "-"}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  item.Status === "Pending" ? "bg-blue-100 text-blue-700" :
                  item.Status === "Scheduled" ? "bg-green-100 text-green-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {item.Status as string}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Symptoms
                  </p>
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {item.Symptoms as string}
                  </p>
                </div>
                
                <div className="flex gap-4 text-sm text-gray-600">
                  <div>
                    <span className="text-gray-400 mr-2">Preferred Date:</span>
                    {item.PreferredDate as string}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(item.id); setForm({ symptoms: item.Symptoms || "", preferredDate: item.PreferredDate || "", specialty: item.Specialty || "", status: item.Status || "Pending" }); }} className="p-2 hover:bg-blue-50 rounded-md text-blue-600"><Edit2 size={16} /></button>
                  <button onClick={() => remove(item.id, true)} className="p-2 hover:bg-yellow-50 rounded-md text-yellow-600" title="Soft delete"><Trash2 size={16} /></button>
                  <button onClick={() => remove(item.id, false)} className="p-2 hover:bg-red-50 rounded-md text-red-600" title="Hard delete"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          );
        })}
        
        {items.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
            No pending requests.
          </div>
        )}
      </div>
      <div className="flex items-center justify-between p-2">
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
  );
}

export default function RequestsPage() {
  return <RequestsClient />;
}
