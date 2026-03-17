import { NextResponse } from "next/server";
import { getBase, TABLE_DOCTORS, TABLE_APPOINTMENTS } from "@/lib/airtable";

export const runtime = "nodejs";

async function loadDoctorLoad(base: any, doctorId: string) {
  try {
    const appts = await base(TABLE_APPOINTMENTS).select({
      fields: ["StartTime", "Status", "Doctor"],
      maxRecords: 500
    }).all();
    const now = Date.now();
    return appts.filter((a: any) => {
      const f = a.fields || {};
      const linkedDoctors = (f.Doctor as string[]) || [];
      if (!linkedDoctors.includes(doctorId)) return false;
      if (String(f.Status || "") === "Cancelled") return false;
      const t = f.StartTime ? Date.parse(String(f.StartTime)) : NaN;
      if (Number.isNaN(t)) return true;
      return t >= now;
    }).length;
  } catch {
    return 0;
  }
}

export async function GET() {
  try {
    const base = getBase();
    const records = await base(TABLE_DOCTORS).select({
      sort: [{ field: "Name", direction: "asc" }]
    }).all();
    const list = [];
    for (const r of records) {
      const load = await loadDoctorLoad(base, r.id);
      list.push({
        id: r.id,
        name: (r.fields as any).Name,
        specialty: (r.fields as any).Specialty,
        email: (r.fields as any).Email || "",
        phone: (r.fields as any).Phone || "",
        status: (r.fields as any).Status || "Active",
        load
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
