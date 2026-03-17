import { NextResponse } from "next/server";
import { getBase, TABLE_DOCTORS, TABLE_APPOINTMENTS, TABLE_RESCHEDULE_LOGS, TABLE_PATIENTS } from "@/lib/airtable";
import nodemailer from "nodemailer";
import { pickDoctorByLoad } from "@/lib/dataAccess";

type Ctx = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const mode = body.mode || "reschedule"; // "reschedule" or "postpone"

    const base = getBase();
    const doc = await base(TABLE_DOCTORS).find(id);
    const specialty = (doc.fields as any).Specialty || "";

    await base(TABLE_DOCTORS).update([{ id, fields: { Status: "Inactive" } }], { typecast: true });

    const upcoming = await base(TABLE_APPOINTMENTS).select({
      filterByFormula: `AND(IS_AFTER({StartTime}, '${new Date().toISOString()}'), SEARCH('${id}', ARRAYJOIN({Doctor})))`,
      fields: ["StartTime", "Doctor", "Department", "Request", "Patient", "Status"],
      maxRecords: 200
    }).all();

    const logs: any[] = [];
    if (mode === "reschedule") {
      for (const a of upcoming) {
        const newDoctorId = await pickDoctorByLoad(specialty);
        if (!newDoctorId) continue;
        await base(TABLE_APPOINTMENTS).update([{ id: a.id, fields: { Doctor: [newDoctorId] } }], { typecast: true });
        logs.push({ appointmentId: a.id, fromDoctor: id, toDoctor: newDoctorId, action: "reschedule", at: new Date().toISOString() });
        const patientId = ((a.fields as any).Patient as string[])?.[0];
        if (patientId) {
          try {
            const p = await base(TABLE_PATIENTS).find(patientId);
            const email = (p.fields as any).Email;
            if (email && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.FROM_EMAIL) {
              const tx = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT || 587),
                secure: false,
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
              });
              await tx.sendMail({
                from: process.env.FROM_EMAIL,
                to: email,
                subject: "Your appointment has been rescheduled",
                text: `Your appointment has been reassigned to another doctor in ${specialty}. New details remain at the same time.\n\nRegards,\nCRODUS AI`
              });
            }
          } catch {}
        }
      }
    } else {
      for (const a of upcoming) {
        await base(TABLE_APPOINTMENTS).update([{ id: a.id, fields: { Status: "Postponed" } }], { typecast: true });
        logs.push({ appointmentId: a.id, fromDoctor: id, action: "postpone", at: new Date().toISOString() });
        const patientId = ((a.fields as any).Patient as string[])?.[0];
        if (patientId) {
          try {
            const p = await base(TABLE_PATIENTS).find(patientId);
            const email = (p.fields as any).Email;
            if (email && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.FROM_EMAIL) {
              const tx = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT || 587),
                secure: false,
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
              });
              await tx.sendMail({
                from: process.env.FROM_EMAIL,
                to: email,
                subject: "Your appointment has been postponed",
                text: `Your appointment has been postponed until your doctor is active again. We will notify you with new details.\n\nRegards,\nCRODUS AI`
              });
            }
          } catch {}
        }
      }
    }
    try {
      await base(TABLE_RESCHEDULE_LOGS).create(
        logs.map(l => ({ fields: { Appointment: [l.appointmentId], FromDoctor: [id], ToDoctor: l.toDoctor ? [l.toDoctor] : undefined, Action: l.action, At: l.at } })),
        { typecast: true }
      );
    } catch {}

    return NextResponse.json({ ok: true, affected: upcoming.length, mode });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
