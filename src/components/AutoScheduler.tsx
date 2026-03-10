"use client";

import { useEffect, useState } from "react";

export default function AutoScheduler({ intervalMs = 30000 }: { intervalMs?: number }) {
  const [status, setStatus] = useState<string>("");
  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const res = await fetch("/api/scheduler", { method: "POST" });
        const data = await res.json();
        if (!active) return;
        const processed = data?.processed ?? (Array.isArray(data?.results) ? data.results.length : 0);
        setStatus(res.ok ? `processed ${processed}` : "error");
      } catch {
        if (!active) return;
        setStatus("error");
      }
    };
    run();
    const id = setInterval(run, intervalMs);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [intervalMs]);
  return <div className="text-xs text-gray-400">{status && `Auto-scheduler: ${status}`}</div>;
}
