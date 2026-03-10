import { NextResponse } from "next/server";
import { processPendingRequests } from "@/lib/schedulerService";

// This endpoint matches the user requirement "Create an API route /api/schedule"
// It triggers the scheduling logic manually.

export async function POST() {
  try {
    const results = await processPendingRequests();
    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
