"use client";

import { useEffect, useState } from "react";
import { Edit2, Trash2, Save, X, Search, Stethoscope, RefreshCw } from "lucide-react";
import RunDoctorTriageButton from "@/components/RunDoctorTriageButton";

type Doctor = { id: string; name: string; specialty: string; email?: string; phone?: string; status?: string; load?: number };
type DoctorPatientAppointment = { id: string; patientId: string; patientName: string; department: string; startTime: string; status: string; urgency: string };

export default function DoctorsPage() {
  const [items, setItems] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ name: "", specialty: "", email: "", phone: "", status: "Active" });
  const [editing, setEditing] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [doctorAppointments, setDoctorAppointments] = useState<DoctorPatientAppointment[]>([]);
  const [doctorAppointmentsLoading, setDoctorAppointmentsLoading] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/doctors");
    const data = await res.json();
    const list: Doctor[] = data.data || [];
    setItems(list);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.name || !form.specialty) return alert("Name and Specialty are required");
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/doctors/${editing}` : "/api/doctors";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) return alert("Save failed");
    setForm({ name: "", specialty: "", email: "", phone: "", status: "Active" });
    setEditing(null);
    load();
  }
  async function remove(id: string) {
    if (!confirm("Delete doctor?")) return;
    const res = await fetch(`/api/doctors/${id}`, { method: "DELETE" });
    if (!res.ok) return alert("Delete failed");
    load();
  }
  async function inactivate(id: string, mode: "reschedule" | "postpone") {
    if (!confirm(`Set doctor inactive and ${mode === "reschedule" ? "reschedule appointments" : "postpone appointments"}?`)) return;
    const res = await fetch(`/api/doctors/${id}/inactivate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode }) });
    const d = await res.json();
    if (!res.ok) return alert(d.error || "Operation failed");
    load();
  }
  async function openDoctorPatients(doctor: Doctor) {
    setSelectedDoctor(doctor);
    setDoctorAppointmentsLoading(true);
    try {
      const res = await fetch(`/api/doctors/${doctor.id}/patients`);
      const data = await res.json();
      setDoctorAppointments(data.data || []);
    } catch {
      setDoctorAppointments([]);
    } finally {
      setDoctorAppointmentsLoading(false);
    }
  }

  const filtered = items.filter(d => {
    const qq = q.toLowerCase();
    return d.name?.toLowerCase().includes(qq) || d.specialty?.toLowerCase().includes(qq);
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Stethoscope className="text-blue-600" /> Doctors</h1>
          <p className="text-gray-500">Manage doctors, availability, and rescheduling.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border rounded-md px-2 py-1">
            <Search className="w-4 h-4 text-gray-500" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search doctors..." className="outline-none text-sm" />
          </div>
          <button onClick={load} className="px-3 py-2 border rounded-md bg-white flex items-center gap-1 text-sm"><RefreshCw className="w-4 h-4" />Refresh</button>
          <RunDoctorTriageButton />
        </div>
      </div>

      <div className="bg-white p-4 border rounded-xl space-y-3">
        <h2 className="font-semibold">Create / Edit Doctor</h2>
        <div className="grid md:grid-cols-5 gap-2">
          <input className="border rounded-md px-2 py-1" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded-md px-2 py-1" placeholder="Specialty" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} />
          <input className="border rounded-md px-2 py-1" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input className="border rounded-md px-2 py-1" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          <select className="border rounded-md px-2 py-1 bg-white" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="px-3 py-2 bg-blue-600 text-white rounded-md">{editing ? "Update" : "Create"}</button>
          {editing && <button onClick={() => { setEditing(null); setForm({ name: "", specialty: "", email: "", phone: "", status: "Active" }); }} className="px-3 py-2 bg-gray-100 rounded-md">Cancel</button>}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-medium text-gray-500">Name</th>
              <th className="px-6 py-4 font-medium text-gray-500">Specialty</th>
              <th className="px-6 py-4 font-medium text-gray-500">Contact</th>
              <th className="px-6 py-4 font-medium text-gray-500">Status</th>
              <th className="px-6 py-4 font-medium text-gray-500">Load</th>
              <th className="px-6 py-4 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(d => (
              <tr key={d.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => openDoctorPatients(d)}>
                <td className="px-6 py-4 font-medium text-gray-900">{d.name}</td>
                <td className="px-6 py-4">{d.specialty}</td>
                <td className="px-6 py-4">{d.email || "-"}{d.phone ? ` • ${d.phone}` : ""}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${d.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                    {d.status}
                  </span>
                </td>
                <td className="px-6 py-4">{typeof d.load === "number" ? d.load : "-"}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setEditing(d.id); setForm({ name: d.name || "", specialty: d.specialty || "", email: d.email || "", phone: d.phone || "", status: d.status || "Active" }); }} className="p-2 hover:bg-blue-50 rounded-md text-blue-600"><Edit2 size={16} /></button>
                    {d.status === "Active" ? (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); inactivate(d.id, "reschedule"); }} className="p-2 hover:bg-yellow-50 rounded-md text-yellow-600">Set Inactive & Reschedule</button>
                        <button onClick={(e) => { e.stopPropagation(); inactivate(d.id, "postpone"); }} className="p-2 hover:bg-orange-50 rounded-md text-orange-600">Set Inactive & Postpone</button>
                      </>
                    ) : null}
                    <button onClick={(e) => { e.stopPropagation(); remove(d.id); }} className="p-2 hover:bg-red-50 rounded-md text-red-600"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No doctors found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {selectedDoctor && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Patients assigned to Dr. {selectedDoctor.name}</h2>
            <button onClick={() => setSelectedDoctor(null)} className="px-3 py-1 border rounded-md text-sm bg-white">Close</button>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium text-gray-500">Patient</th>
                <th className="px-6 py-3 font-medium text-gray-500">Department</th>
                <th className="px-6 py-3 font-medium text-gray-500">Start Time</th>
                <th className="px-6 py-3 font-medium text-gray-500">Urgency</th>
                <th className="px-6 py-3 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {doctorAppointmentsLoading ? (
                <tr><td colSpan={5} className="px-6 py-6 text-center text-gray-500">Loading...</td></tr>
              ) : doctorAppointments.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-6 text-center text-gray-500">No patients assigned.</td></tr>
              ) : doctorAppointments.map(a => (
                <tr key={a.id}>
                  <td className="px-6 py-3">{a.patientName}</td>
                  <td className="px-6 py-3">{a.department}</td>
                  <td className="px-6 py-3">{a.startTime ? new Date(a.startTime).toLocaleString() : "-"}</td>
                  <td className="px-6 py-3">{a.urgency}</td>
                  <td className="px-6 py-3">{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
