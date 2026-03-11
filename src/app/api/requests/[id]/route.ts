import { NextResponse } from "next/server";
import { getBase, TABLE_APPOINTMENT_REQUESTS } from "@/lib/airtable";

type ParamsPromise = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

export async function GET(_: Request, ctx: ParamsPromise) {
  try {
    const { id } = await ctx.params;
    const base = getBase();
    const r = await base(TABLE_APPOINTMENT_REQUESTS).find(id);
    return NextResponse.json({ data: { id: r.id, ...r.fields } });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request, ctx: ParamsPromise) {
  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const base = getBase();
    const fields: Record<string, unknown> = {};
    if (body.symptoms !== undefined) fields.Symptoms = body.symptoms;
    if (body.preferredDate !== undefined) fields.PreferredDate = body.preferredDate;
    if (body.specialty !== undefined) fields.Specialty = body.specialty;
    if (body.status !== undefined) fields.Status = body.status;
    const updated = await base(TABLE_APPOINTMENT_REQUESTS).update([{ id, fields: fields as unknown as any }], { typecast: true });
    return NextResponse.json({ data: { id: updated[0].id, ...updated[0].fields } });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request, ctx: ParamsPromise) {
  try {
    const { id } = await ctx.params;
    const url = new URL(request.url);
    const soft = url.searchParams.get("soft") === "true";
    const base = getBase();
    if (soft) {
      const updated = await base(TABLE_APPOINTMENT_REQUESTS).update([{ id, fields: { Status: "Cancelled" } }], { typecast: true });
      return NextResponse.json({ data: { id: updated[0].id, ...updated[0].fields } });
    } else {
      await base(TABLE_APPOINTMENT_REQUESTS).destroy([id]);
      return NextResponse.json({ ok: true });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
