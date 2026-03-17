# CRODUS AI - Hospital Workflow Automation

A Next.js 16 application for automating hospital patient intake, triage, and appointment scheduling using AI.

## Features

- **Patient Intake**: Web form for patients to submit symptoms and preferred dates.
- **AI Triage Engine**: Automatically classifies symptoms by department (e.g., Cardiology, Neurology) and urgency (Low to Critical) using keyword rules and OpenAI.
- **Manual Scheduler**: Admin can trigger scheduling from the Requests page button.
- **Admin Dashboard**: Real-time view of requests, appointments, and system status.
- **Conversational Query**: Ask questions like "How many urgent cases today?" using natural language.


## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS, Lucide Icons, Framer Motion
- **Database**: Airtable
- **AI**: OpenAI API (GPT-4o)
- **Deployment**: Vercel (Serverless; manual triggers, no cron)

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file with the following keys:

```bash
AIRTABLE_API_KEY=pat...
AIRTABLE_BASE_ID=app...
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
```

Firebase setup guide: `FIREBASE_AUTH_SETUP.md`

### 2. Airtable Schema

Create a new Airtable Base with the following tables and fields:

**Table: Patients**
- Name (Single line text)
- Email (Email)
- Phone (Phone number)

**Table: AppointmentRequests**
- Status (Single select: Pending, Scheduled, Cancelled)
- Symptoms (Long text)
- PreferredDate (Date)
- Patient (Link to Patients)
- SubmittedAt (Created time)
- TriageResult (Link to TriageResults)
- Appointment (Link to Appointments)

**Table: TriageResults**
- Request (Link to AppointmentRequests)
- Department (Single select: Cardiology, Neurology, Orthopedics, General Medicine, Dermatology)
- Urgency (Single select: Low, Medium, High, Critical)
- Confidence (Number)
- Reasoning (Long text)

**Table: Appointments**
- Patient (Link to Patients)
- Request (Link to AppointmentRequests)
- Department (Single select)
- StartTime (Date with time)
- Status (Single select: Confirmed, Completed, Cancelled)
- Urgency (Single select)

### 3. Installation

```bash
npm install
npm run dev
```

### 4. Deployment

Deploy to Vercel. No cron configuration is required. Ensure you add the Environment Variables in the Vercel Project Settings.
