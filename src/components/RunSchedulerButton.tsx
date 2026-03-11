"use client";

import { useState } from "react";

export default function RunSchedulerButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  async function run() {
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch("/api/scheduler", { method: "POST" });
      const data = await res.json();
      const processed = data?.processed ?? (Array.isArray(data?.results) ? data.results.length : 0);
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
        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-70"
      >
        {loading ? "Running..." : "Run Scheduler"}
      </button>
      {status && <span className="text-xs text-gray-500">{status}</span>}
    </div>
  );
}
