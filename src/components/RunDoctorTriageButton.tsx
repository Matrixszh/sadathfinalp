"use client";

import { useState } from "react";

export default function RunDoctorTriageButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  async function run() {
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch("/api/doctor-triage", { method: "POST" });
      const data = await res.json();
      const processed = data?.processed ?? 0;
      setStatus(res.ok ? `Processed ${processed}` : "Error");
    } catch {
      setStatus("Error");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={run}
        disabled={loading}
        className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-70"
      >
        {loading ? "Running..." : "Run Doctor Triage"}
      </button>
      {status && <span className="text-xs text-gray-500">{status}</span>}
    </div>
  );
}
