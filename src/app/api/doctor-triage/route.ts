import { NextResponse } from "next/server";
import { getBase, TABLE_APPOINTMENTS, TABLE_DOCTORS } from "@/lib/airtable";
import { listActiveDoctorsBySpecialty, computeDoctorLoad, normalizeSpecialtyForDoctor } from "@/lib/dataAccess";
import { getCompletion } from "@/lib/openai";

export const runtime = "nodejs";

export async function POST() {
  try {
    const base = getBase();
    const appts = await base(TABLE_APPOINTMENTS).select({
      fields: ["Department", "Urgency", "Doctor", "StartTime", "Status"],
      maxRecords: 200
    }).all();

    let processed = 0;
    let inspected = 0;
    let needsAssignmentCount = 0;
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
        try {
          const d = await base(TABLE_DOCTORS).find(currentDoctorId);
          const status = String((d.fields as any).Status || "Active");
          if (status !== "Active") needsAssignment = true;
        } catch {
          needsAssignment = true;
        }
      }
      if (!needsAssignment) continue;
      needsAssignmentCount++;

      const specialty = normalizeSpecialtyForDoctor(dept);
      let candidates: any[] = [];
      try {
        candidates = Array.from(await listActiveDoctorsBySpecialty(specialty) as any);
      } catch {
        candidates = [];
      }
      if (candidates.length === 0) {
        candidates = Array.from(await base(TABLE_DOCTORS).select({
          filterByFormula: `{Specialty} = '${specialty}'`,
          fields: ["Name", "Specialty", "Status"],
          maxRecords: 50
        }).all() as any);
        if (candidates.length === 0) continue;
      }
      const candList: { id: string; name: string; load: number }[] = [];
      for (const d of candidates) {
        const name = String((d.fields as any).Name || "");
        const load = await computeDoctorLoad(d.id);
        candList.push({ id: d.id, name, load });
      }
      candList.sort((a, b) => a.load - b.load);

      let chosen = candList[0]?.id;
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

      if (!chosen) continue;
      try {
        await base(TABLE_APPOINTMENTS).update([{ id: a.id, fields: { Doctor: [chosen] } }], { typecast: true });
        processed++;
      } catch {}
    }

    return NextResponse.json({ processed, inspected, needsAssignment: needsAssignmentCount });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
