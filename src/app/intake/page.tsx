"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Calendar, Activity, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function IntakePage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    symptoms: "",
    preferredDate: "",
    specialty: "",
  });
  
  const specialties = [
    "General Practice",
    "Cardiology",
    "Dentistry",
    "Neurology",
    "Orthopedics",
    "Pediatrics",
    "Dermatology",
    "Psychiatry",
    "Other"
  ];

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [triage, setTriage] = useState<{ department?: string; urgency?: string; confidence?: number } | null>(null);
  const [appointmentInfo, setAppointmentInfo] = useState<{ time?: string; doctorId?: string } | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setProgress(10);
    setStatus("idle");
    setMessage("");

    try {
      const res = await apiFetch("/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to submit request");

      setProgress(40);
      setMessage("AI triage in progress...");

      const schedRes = await fetch("/api/scheduler", { method: "POST" });
      const schedData = await schedRes.json();
      setProgress(70);

      if (!schedRes.ok) throw new Error(schedData.error || "Scheduling failed");

      const result = Array.isArray(schedData.results)
        ? schedData.results.find((r: any) => r.requestId === data.requestId)
        : null;

      if (result) {
        setTriage({
          department: result.triage?.department || result.department,
          urgency: result.triage?.urgency,
          confidence: result.triage?.confidence,
        });
        setAppointmentInfo({
          time: result.time ? new Date(result.time).toLocaleString() : undefined,
          doctorId: result.doctorId,
        });
        setMessage("Request scheduled successfully.");
      } else {
        setMessage("Request submitted. Scheduling will complete shortly.");
      }

      setProgress(100);
      setStatus("success");
      setForm({ name: "", email: "", phone: "", symptoms: "", preferredDate: "", specialty: "" });
    } catch (err: unknown) {
      setStatus("error");
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="bg-blue-600 p-6 text-white text-center">
          <h1 className="text-2xl font-bold">Patient Intake</h1>
          <p className="text-blue-100 mt-2">Please describe your symptoms for rapid triage.</p>
        </div>

        <div className="p-8">
          {status === "success" ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Request Submitted!</h2>
              <p className="text-gray-600">{message}</p>
              <button 
                onClick={() => setStatus("idle")}
                className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Submit Another
              </button>
              {triage && (
                <div className="mt-6 text-left bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="text-sm text-gray-600">Department: <span className="font-semibold text-gray-900">{triage.department}</span></div>
                  {triage.urgency && (
                    <div className="text-sm text-gray-600">Urgency: <span className="font-semibold text-gray-900">{triage.urgency}</span></div>
                  )}
                  {typeof triage.confidence === "number" && (
                    <div className="text-sm text-gray-600">Confidence: <span className="font-semibold text-gray-900">{Math.round(triage.confidence * 100)}%</span></div>
                  )}
                  {appointmentInfo?.time && (
                    <div className="text-sm text-gray-600">Appointment: <span className="font-semibold text-gray-900">{appointmentInfo.time}</span></div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {status === "error" && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <p>{message}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" /> Full Name
                </label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" /> Email
                  </label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" /> Phone
                  </label>
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gray-400" /> Symptoms
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.symptoms}
                  onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Describe your symptoms in detail (e.g., severe headache, chest pain...)"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gray-400" /> Preferred Specialty
                </label>
                <select
                  value={form.specialty}
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                >
                  <option value="">No Preference / Not Sure</option>
                  {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" /> Preferred Date
                </label>
                <input
                  required
                  type="date"
                  value={form.preferredDate}
                  onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Submit Request"
                )}
              </button>
              {loading && (
                <div className="mt-4">
                  <div className="h-2 w-full bg-gray-200 rounded">
                    <div
                      className="h-2 bg-blue-600 rounded transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {progress < 40 && "Submitting request..."}
                    {progress >= 40 && progress < 70 && "AI triage processing..."}
                    {progress >= 70 && progress < 100 && "Scheduling appointment..."}
                    {progress === 100 && "Completed"}
                  </p>
                </div>
              )}
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
