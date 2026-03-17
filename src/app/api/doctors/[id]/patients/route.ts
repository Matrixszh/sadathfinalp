import { NextResponse } from "next/server";
import { getBase, TABLE_APPOINTMENTS, TABLE_PATIENTS } from "@/lib/airtable";

type Ctx = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

export async function GET(_: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const base = getBase();
    const appts = await base(TABLE_APPOINTMENTS).select({
      fields: ["Patient", "Department", "StartTime", "Status", "Urgency", "Doctor"],
      maxRecords: 500
    }).all();
    const linked = appts.filter((a: any) => {
      const doctorLinks = ((a.fields || {}).Doctor as string[]) || [];
      return doctorLinks.includes(id);
    });
    const patientIds = Array.from(new Set(linked.flatMap((a: any) => (((a.fields || {}).Patient as string[]) || []))));
    const patientNameById: Record<string, string> = {};
    for (const pid of patientIds) {
      try {
        const p = await base(TABLE_PATIENTS).find(pid);
        patientNameById[pid] = String((p.fields as any).Name || "");
      } catch {}
    }
    const data = linked.map((a: any) => {
      const f = a.fields || {};
      const pid = ((f.Patient as string[]) || [])[0] || "";
      return {
        id: a.id,
        patientId: pid,
        patientName: patientNameById[pid] || `Patient ${pid.slice(-4)}`,
        department: String(f.Department || ""),
        startTime: String(f.StartTime || ""),
        status: String(f.Status || ""),
        urgency: String(f.Urgency || "")
      };
    });
    return NextResponse.json({ data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
