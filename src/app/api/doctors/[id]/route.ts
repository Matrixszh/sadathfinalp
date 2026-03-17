import { NextResponse } from "next/server";
import { getBase, TABLE_DOCTORS, TABLE_APPOINTMENTS, TABLE_RESCHEDULE_LOGS } from "@/lib/airtable";
import { pickDoctorByLoad } from "@/lib/dataAccess";

type Ctx = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

export async function GET(_: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const base = getBase();
    const r = await base(TABLE_DOCTORS).find(id);
    return NextResponse.json({ data: { id: r.id, ...(r.fields as any) } });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const base = getBase();
    // Only include stable fields to avoid UNKNOWN_FIELD_NAME when optional columns are absent.
    const fields: Record<string, unknown> = {};
    if (body.name !== undefined) fields.Name = body.name;
    if (body.specialty !== undefined) fields.Specialty = body.specialty;
    if (body.email !== undefined) fields.Email = body.email;
    if (body.status !== undefined) fields.Status = body.status;
    const updated = await base(TABLE_DOCTORS).update([{ id, fields: fields as any }], { typecast: true });
    return NextResponse.json({ data: { id: updated[0].id, ...(updated[0].fields as any) } });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const base = getBase();
    await base(TABLE_DOCTORS).destroy([id]);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
