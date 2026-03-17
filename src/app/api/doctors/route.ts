import { NextResponse } from "next/server";
import { getBase, TABLE_DOCTORS, TABLE_APPOINTMENTS } from "@/lib/airtable";

export const runtime = "nodejs";

export async function GET() {
  try {
    const base = getBase();
    const [records, appts] = await Promise.all([
      base(TABLE_DOCTORS).select({
      sort: [{ field: "Name", direction: "asc" }]
      }).all(),
      base(TABLE_APPOINTMENTS).select({
        fields: ["StartTime", "Status", "Doctor"],
        maxRecords: 500
      }).all()
    ]);
    const now = Date.now();
    const loadByDoctorId: Record<string, number> = {};
    for (const a of appts as any[]) {
      const f = a.fields || {};
      if (String(f.Status || "") === "Cancelled") continue;
      const t = f.StartTime ? Date.parse(String(f.StartTime)) : NaN;
      if (!Number.isNaN(t) && t < now) continue;
      const linkedDoctors = (f.Doctor as string[]) || [];
      for (const did of linkedDoctors) {
        loadByDoctorId[did] = (loadByDoctorId[did] || 0) + 1;
      }
    }
    const list = [];
    for (const r of records) {
      list.push({
        id: r.id,
        name: (r.fields as any).Name,
        specialty: (r.fields as any).Specialty,
        email: (r.fields as any).Email || "",
        phone: (r.fields as any).Phone || "",
        status: (r.fields as any).Status || "Active",
        load: loadByDoctorId[r.id] || 0
      });
    }
    return NextResponse.json({ data: list });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, specialty, email, status } = body;
    if (!name || !specialty) {
      return NextResponse.json({ error: "name and specialty are required" }, { status: 400 });
    }
    const base = getBase();
    // Only include fields known to exist in many bases (Name, Specialty, Email, Status).
    // Phone is omitted to avoid UNKNOWN_FIELD_NAME errors if the column doesn't exist.
    const fields: Record<string, any> = { Name: name, Specialty: specialty, Status: status || "Active" };
    if (email) fields.Email = email;
    const created = await base(TABLE_DOCTORS).create([{ fields }], { typecast: true });
    return NextResponse.json({ data: { id: created[0].id, ...(created[0].fields as any) } }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
