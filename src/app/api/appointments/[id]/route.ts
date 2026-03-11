import { NextResponse } from "next/server";
import { getBase, TABLE_APPOINTMENTS } from "@/lib/airtable";

type ParamsPromise = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

export async function GET(_: Request, ctx: ParamsPromise) {
  try {
    const { id } = await ctx.params;
    const base = getBase();
    const r = await base(TABLE_APPOINTMENTS).find(id);
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
    if (body.department) fields.Department = body.department;
    if (body.startTime) fields.StartTime = new Date(body.startTime).toISOString();
    if (body.status) fields.Status = body.status;
    if (body.urgency) fields.Urgency = body.urgency;
    const updated = await base(TABLE_APPOINTMENTS).update([{ id, fields: fields as unknown as any }], { typecast: true });
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
      const updated = await base(TABLE_APPOINTMENTS).update([{ id, fields: { Status: "Cancelled" } }], { typecast: true });
      return NextResponse.json({ data: { id: updated[0].id, ...updated[0].fields } });
    } else {
      await base(TABLE_APPOINTMENTS).destroy([id]);
      return NextResponse.json({ ok: true });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
