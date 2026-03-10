# CRODUS AI - Hospital Workflow Automation

A Next.js 16 application for automating hospital patient intake, triage, and appointment scheduling using AI.

## Features

- **Patient Intake**: Web form for patients to submit symptoms and preferred dates.
- **AI Triage Engine**: Automatically classifies symptoms by department (e.g., Cardiology, Neurology) and urgency (Low to Critical) using keyword rules and OpenAI.
- **Auto-Scheduler**: Assigns appointments based on medical urgency (Critical = Same Day).
- **Admin Dashboard**: Real-time view of requests, appointments, and system status.
- **Conversational Query**: Ask questions like "How many urgent cases today?" using natural language.
- **Background Jobs**: Vercel Cron automatically processes pending requests every minute.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS, Lucide Icons, Framer Motion
- **Database**: Airtable
- **AI**: OpenAI API (GPT-4o)
- **Deployment**: Vercel (Serverless + Cron)

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file with the following keys:

```bash
AIRTABLE_API_KEY=pat...
AIRTABLE_BASE_ID=app...
OPENAI_API_KEY=sk-...
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
```

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

Deploy to Vercel. The `vercel.json` file is pre-configured for Cron Jobs.
Ensure you add the Environment Variables in the Vercel Project Settings.
