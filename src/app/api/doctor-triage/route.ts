import { NextResponse } from "next/server";
import { getBase, TABLE_APPOINTMENTS, TABLE_DOCTORS } from "@/lib/airtable";
import { normalizeSpecialtyForDoctor } from "@/lib/dataAccess";
import { getCompletion } from "@/lib/openai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const startedAt = Date.now();
    const url = new URL(request.url);
    const useAi = url.searchParams.get("ai") === "1";
    const verbose = url.searchParams.get("verbose") !== "0";
    const runId = `doctor-triage-${Date.now()}`;
    console.log(`[${runId}] started useAi=${useAi}`);

    const base = getBase();
    const [appts, doctors] = await Promise.all([
      base(TABLE_APPOINTMENTS).select({
        fields: ["Department", "Urgency", "Doctor", "StartTime", "Status"],
        maxRecords: 500
      }).all(),
      base(TABLE_DOCTORS).select({
        fields: ["Name", "Specialty", "Status"],
        maxRecords: 500
      }).all()
    ]);

    const doctorById: Record<string, { name: string; specialty: string; status: string }> = {};
    const activeBySpecialty: Record<string, string[]> = {};
    const anyBySpecialty: Record<string, string[]> = {};
    for (const d of doctors as any[]) {
      const f = d.fields || {};
      const specialty = normalizeSpecialtyForDoctor(String(f.Specialty || "").trim());
      const status = String(f.Status || "Active");
      doctorById[d.id] = { name: String(f.Name || d.id), specialty, status };
      if (!anyBySpecialty[specialty]) anyBySpecialty[specialty] = [];
      anyBySpecialty[specialty].push(d.id);
      if (status === "Active") {
        if (!activeBySpecialty[specialty]) activeBySpecialty[specialty] = [];
        activeBySpecialty[specialty].push(d.id);
      }
    }

    const now = Date.now();
    const loadByDoctor: Record<string, number> = {};
    for (const a of appts as any[]) {
      const f = a.fields || {};
      if (String(f.Status || "") === "Cancelled") continue;
      const t = f.StartTime ? Date.parse(String(f.StartTime)) : NaN;
      if (!Number.isNaN(t) && t < now) continue;
      const linked = (f.Doctor as string[]) || [];
      for (const did of linked) {
        loadByDoctor[did] = (loadByDoctor[did] || 0) + 1;
      }
    }

    let processed = 0;
    let inspected = 0;
    let needsAssignmentCount = 0;
    const samples: string[] = [];
    for (const a of appts) {
      const f = a.fields as any;
      inspected++;
      const statusVal = String(f.Status || "");
      if (statusVal === "Cancelled" || statusVal === "Completed") continue;
      const dept = String(f.Department || "");
      if (!dept) continue;
      const currentDoctorId = (f.Doctor as string[])?.[0] || "";
      let needsAssignment = false;
      if (!currentDoctorId) {
        needsAssignment = true;
      } else {
        const current = doctorById[currentDoctorId];
        if (!current || current.status !== "Active") {
          needsAssignment = true;
        }
      }
      if (!needsAssignment) continue;
      needsAssignmentCount++;

      const specialty = normalizeSpecialtyForDoctor(dept);
      const candidates = (activeBySpecialty[specialty] && activeBySpecialty[specialty].length > 0)
        ? activeBySpecialty[specialty]
        : (anyBySpecialty[specialty] || []);
      if (candidates.length === 0) continue;
      const candList: { id: string; name: string; load: number }[] = [];
      for (const d of candidates) {
        candList.push({ id: d, name: doctorById[d]?.name || d, load: loadByDoctor[d] || 0 });
      }
      candList.sort((a, b) => a.load - b.load);

      let chosen = candList[0]?.id;
      if (useAi && candList.length > 1) {
        try {
          const prompt = `Choose the best doctor for this appointment using the following JSON. Consider lower load and exact specialty fit.\nAppointment: {"department":"${dept}","urgency":"${String(f.Urgency || "")}","start":"${String(f.StartTime || "")}"}\nCandidates: ${JSON.stringify(candList)}\nReturn ONLY JSON: {"doctorId":"..."}\n`;
          const resp = await getCompletion(prompt);
          if (resp) {
            const jsonStr = resp.replace(/```json/g, "").replace(/```/g, "").trim();
            const result = JSON.parse(jsonStr);
            const proposed = String(result.doctorId || "");
            if (candList.find(c => c.id === proposed)) chosen = proposed;
          }
        } catch {}
      }

      if (!chosen) continue;
      try {
        await base(TABLE_APPOINTMENTS).update([{ id: a.id, fields: { Doctor: [chosen] } }], { typecast: true });
        processed++;
        loadByDoctor[chosen] = (loadByDoctor[chosen] || 0) + 1;
        if (samples.length < 20) {
          const line = `appt=${a.id} dept=${dept} -> doctor=${doctorById[chosen]?.name || chosen}`;
          samples.push(line);
          if (verbose) console.log(`[${runId}] ${line}`);
        }
      } catch {}
    }

    const durationMs = Date.now() - startedAt;
    console.log(`[${runId}] completed inspected=${inspected} needsAssignment=${needsAssignmentCount} processed=${processed} durationMs=${durationMs}`);
    return NextResponse.json({ processed, inspected, needsAssignment: needsAssignmentCount, durationMs, runId, samples, useAi });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    console.error("[doctor-triage] failed:", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
