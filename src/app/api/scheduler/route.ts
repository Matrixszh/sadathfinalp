import { NextResponse } from "next/server";
import { processPendingRequests } from "@/lib/schedulerService";

export const runtime = "nodejs";

export async function GET() {
  return POST();
}

export async function POST() {
  try {
    console.log("Running Scheduler...");
    const results = await processPendingRequests();
    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error: any) {
    console.error("Scheduler Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
