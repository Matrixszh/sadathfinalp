import { NextResponse } from "next/server";
import { getBase, TABLE_APPOINTMENTS, TABLE_APPOINTMENT_REQUESTS } from "@/lib/airtable";
import { getCompletion } from "@/lib/openai";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query) return NextResponse.json({ error: "Query required" }, { status: 400 });

    const base = getBase();

    // 1. Aggregate Data (In a real app, use a more efficient query or caching)
    const appointments = await base(TABLE_APPOINTMENTS).select({
      fields: ["Department", "Urgency", "Status", "StartTime"]
    }).all();

    const requests = await base(TABLE_APPOINTMENT_REQUESTS).select({
      fields: ["Status", "Symptoms", "SubmittedAt"]
    }).all();

    // Summarize
    const stats = {
      totalAppointments: appointments.length,
      byDepartment: {} as Record<string, number>,
      byUrgency: {} as Record<string, number>,
      pendingRequests: requests.filter(r => r.fields.Status === "Pending").length,
      totalRequests: requests.length
    };

    appointments.forEach(r => {
      const dept = (r.fields.Department as string) || "Unknown";
      const urgency = (r.fields.Urgency as string) || "Unknown";
      stats.byDepartment[dept] = (stats.byDepartment[dept] || 0) + 1;
      stats.byUrgency[urgency] = (stats.byUrgency[urgency] || 0) + 1;
    });

    // 2. Send to OpenAI
    const systemPrompt = `
      You are an AI assistant for a hospital administration dashboard.
      You have access to the following aggregated real-time data:
      ${JSON.stringify(stats, null, 2)}
      
      Answer the user's question based strictly on this data.
      Do not make up information.
      If the user asks about specific patient names, refuse to answer for privacy reasons.
      Keep answers concise and professional.
    `;

    const answer = await getCompletion(`${systemPrompt}\n\nUser Question: ${query}`);

    return NextResponse.json({ answer });

  } catch (error: any) {
    console.error("Query Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
