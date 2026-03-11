import { NextResponse } from "next/server";
import { getBase, TABLE_APPOINTMENT_REQUESTS } from "@/lib/airtable";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") || "";
    const status = url.searchParams.get("status") || "";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10", 10);

    const base = getBase();
    const records = await base(TABLE_APPOINTMENT_REQUESTS).select({
      fields: ["Patient", "Symptoms", "PreferredDate", "Status", "Specialty", "SubmittedAt"],
      sort: [{ field: "SubmittedAt", direction: "desc" }]
    }).all();

    let data: any[] = records.map(r => ({ id: r.id, ...(r.fields as any) }));
    if (q) {
      const qq = q.toLowerCase();
      data = data.filter(d =>
        String(d.Symptoms || "").toLowerCase().includes(qq) ||
        String(d.Specialty || "").toLowerCase().includes(qq)
      );
    }
    if (status) {
      data = data.filter(d => (d.Status || "") === status);
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
    const { patientId, symptoms, preferredDate, specialty, status } = body;
    if (!symptoms) {
      return NextResponse.json({ error: "symptoms is required" }, { status: 400 });
    }
    const base = getBase();
    const created = await base(TABLE_APPOINTMENT_REQUESTS).create([
      {
        fields: {
          Patient: patientId ? [patientId] : undefined,
          Symptoms: symptoms,
          PreferredDate: preferredDate || "",
          Specialty: specialty || "",
          Status: status || "Pending"
        }
      }
    ], { typecast: true });
    return NextResponse.json({ data: { id: created[0].id, ...created[0].fields } }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
