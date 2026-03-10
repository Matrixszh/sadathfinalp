import { NextResponse } from "next/server";
import { getBase, TABLE_APPOINTMENT_REQUESTS, TABLE_PATIENTS } from "@/lib/airtable";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, symptoms, preferredDate, specialty } = body;

    if (!name || !email || !symptoms) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const base = getBase();

    // 1. Create or Find Patient
    // For simplicity, we'll just create a new patient or assume checking by email would happen here.
    // In a real app, we'd search first.
    let patientId: string;
    
    // Search for existing patient
    const existingPatients = await base(TABLE_PATIENTS).select({
      filterByFormula: `{Email} = '${email}'`,
      maxRecords: 1
    }).firstPage();

    if (existingPatients.length > 0) {
      patientId = existingPatients[0].id;
    } else {
      const newPatient = await base(TABLE_PATIENTS).create([
        {
          fields: {
            Name: name,
            Email: email,
            Phone: phone,
          }
        }
      ]);
      patientId = newPatient[0].id;
    }

    // 2. Create Appointment Request
    const newRequest = await base(TABLE_APPOINTMENT_REQUESTS).create([
      {
        fields: {
          Patient: [patientId],
          Symptoms: symptoms,
          PreferredDate: preferredDate,
          Specialty: specialty,
          Status: "Pending", // Initial status
          // SubmittedAt is a computed "Created time" field in Airtable, so we don't send it.
        }
      }
    ], { typecast: true });

    return NextResponse.json({ 
      success: true, 
      requestId: newRequest[0].id 
    });

  } catch (error: any) {
    console.error("Intake Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
