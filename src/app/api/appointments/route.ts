import { NextResponse } from "next/server";
import { getBase, TABLE_APPOINTMENTS, TABLE_PATIENTS, TABLE_DOCTORS } from "@/lib/airtable";
import { pickDoctorByLoad, normalizeSpecialtyForDoctor } from "@/lib/dataAccess";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") || "";
    const status = url.searchParams.get("status") || "";
    const department = url.searchParams.get("department") || "";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10", 10);

    const base = getBase();
    const records = await base(TABLE_APPOINTMENTS).select({
      fields: ["Patient", "Request", "Department", "Doctor", "StartTime", "Status", "Urgency"],
      sort: [{ field: "StartTime", direction: "asc" }]
    }).all();

    const patientIds = Array.from(new Set(records.flatMap(r => ((r.fields as any).Patient as string[]) || [])));
    const doctorIds = Array.from(new Set(records.flatMap(r => ((r.fields as any).Doctor as string[]) || [])));
    const nameById: Record<string, string> = {};
    const doctorNameById: Record<string, string> = {};
    const [allPatients, allDoctors] = await Promise.all([
      base(TABLE_PATIENTS).select({ fields: ["Name"], maxRecords: 500 }).all(),
      base(TABLE_DOCTORS).select({ fields: ["Name"], maxRecords: 500 }).all()
    ]);
    for (const p of allPatients as any[]) {
      if (patientIds.includes(p.id)) nameById[p.id] = String((p.fields || {}).Name || "");
    }
    for (const d of allDoctors as any[]) {
      if (doctorIds.includes(d.id)) doctorNameById[d.id] = String((d.fields || {}).Name || "");
    }

    let data: any[] = records.map(r => {
      const f = r.fields as any;
      const pid = (f.Patient as string[])?.[0] || "";
      const did = (f.Doctor as string[])?.[0] || "";
      return { id: r.id, ...f, patientName: nameById[pid] || "", doctorName: doctorNameById[did] || "" };
    });
    if (q) {
      const qq = q.toLowerCase();
      data = data.filter(d => String(d.Department || "").toLowerCase().includes(qq));
    }
    if (status) {
      data = data.filter(d => (d.Status || "") === status);
    }
    if (department) {
      data = data.filter(d => (d.Department || "") === department);
    }

    const total = data.length;
    const start = (page - 1) * pageSize;
    const paged = data.slice(start, start + pageSize);

    return NextResponse.json({ data: paged, page, pageSize, total });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patientId, requestId, department, startTime, status, urgency, doctorId } = body;

    if (!department || !startTime) {
      return NextResponse.json({ error: "department and startTime are required" }, { status: 400 });
    }

    const base = getBase();
    let chosenDoctorId: string | null = doctorId || null;
    if (!chosenDoctorId && department) {
      try {
        chosenDoctorId = await pickDoctorByLoad(normalizeSpecialtyForDoctor(department));
      } catch {}
    }
    const fields: any = {
      Patient: patientId ? [patientId] : undefined,
      Request: requestId ? [requestId] : undefined,
      Department: department,
      StartTime: new Date(startTime).toISOString(),
      Status: status || "Confirmed",
      Urgency: urgency || "Medium"
    };
    if (chosenDoctorId) fields.Doctor = [chosenDoctorId];
    const created = await base(TABLE_APPOINTMENTS).create([{ fields }], { typecast: true });

    return NextResponse.json({ data: { id: created[0].id, ...created[0].fields } }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
