# System Architecture: CRODUS AI Hospital Workflow

## 1. High-Level Overview

**CRODUS AI** is a hospital workflow automation system built on **Next.js 16**. It acts as an intelligent intermediary between patients and hospital resources.

*   **Frontend**: A responsive web application (React 19, Tailwind CSS) for patient intake and administrative management.
*   **Backend**: Serverless API routes that handle data processing, AI triage, and scheduling logic.
*   **Database**: Airtable serves as the central relational database.
*   **Intelligence**: OpenAI (GPT-4o) provides advanced symptom analysis and conversational query capabilities.
*   **Automation**: Vercel Cron triggers background jobs for real-time processing.

## 2. Core Modules

### A. Patient Intake Module
*   **Component**: `src/app/intake/page.tsx`
*   **API**: `src/app/api/intake/route.ts`
*   **Logic**:
    1.  User submits personal details and symptoms.
    2.  System creates or updates a **Patient** record in Airtable.
    3.  Creates a new **AppointmentRequest** with status `Pending`.
    4.  Note: The `SubmittedAt` field is handled automatically by Airtable's "Created time" field type.

### B. AI Triage Engine
*   **Library**: `src/lib/triageEngine.ts`
*   **Logic**: A hybrid classification system.
    1.  **Keyword Analysis**: Checks symptoms against a dictionary of medical terms (e.g., "chest pain" -> Cardiology/Critical). This ensures instant, deterministic handling of obvious emergencies.
    2.  **LLM Fallback**: If no keywords match, it sends the text to OpenAI GPT-4o with a structured prompt to determine Department and Urgency.
    3.  **Output**: Returns a standardized result: `Department` (e.g., Cardiology), `Urgency` (Low/Medium/High/Critical), and `Reasoning`.

### C. Automated Scheduler
*   **Library**: `src/lib/schedulerService.ts`
*   **Trigger**: `/api/scheduler` triggered via Vercel Cron (every minute) or manually via a button in the admin Requests page.
*   **Logic**:
    1.  Fetches `Pending` requests from Airtable.
    2.  Runs the request through the **Triage Engine**.
    3.  Saves the result to the **TriageResults** table.
    4.  **Priority Scheduling**:
        *   **Critical**: Schedules for **Today**.
        *   **High**: Schedules for **Tomorrow**.
        *   **Medium**: Schedules within **3 Days**.
        *   **Low**: Schedules within **1 Week**.
    5.  **Slot Finding**: Currently simulates finding the next available slot between 9 AM - 5 PM.
    6.  Creates an **Appointment** record and updates the request status to `Scheduled`.

### D. Conversational Query System
*   **API**: `src/app/api/query/route.ts`
*   **UI**: `src/components/QueryBox.tsx` embedded in the Dashboard.
*   **Logic**:
    1.  Aggregates real-time data from `Appointments` and `AppointmentRequests` tables (counts by department, urgency, status).
    2.  Constructs a system prompt containing this JSON summary.
    3.  Sends the user's natural language question to OpenAI.
    4.  Returns a safe, data-driven answer (PII is stripped before sending).

## 3. Data Schema (Airtable)

The system relies on four relational tables. You must create these tables in your Airtable Base with the exact field names and types listed below.

### 1. **Patients**
*   `Name` (Single Line Text)
*   `Email` (Email)
*   `Phone` (Phone Number)
*   `Notes` (Long Text) - Optional

### 2. **AppointmentRequests**
*   `Patient` (Link to **Patients**)
*   `Symptoms` (Long Text)
*   `PreferredDate` (Date)
*   `Specialty` (Single Select or Single Line Text) - Optional preference (not linked)
*   `Status` (Single Select): Pending, Scheduled, Cancelled
*   `TriageResult` (Link to **TriageResults**)
*   `Appointment` (Link to **Appointments**)
*   `SubmittedAt` (Created Time)

### 3. **TriageResults**
*   `Request` (Link to **AppointmentRequests**)
*   `Department` (Single Line Text) - Output from AI
*   `Urgency` (Single Select): Low, Medium, High, Critical
*   `Confidence` (Number)
*   `Reasoning` (Long Text)

### 4. **Appointments**
*   `Patient` (Link to **Patients**)
*   `Request` (Link to **AppointmentRequests**)
*   `Department` (Single Line Text)
*   `StartTime` (Date & Time)
*   `Status` (Single Select): Confirmed, Completed, Cancelled
*   `Urgency` (Single Select): Low, Medium, High, Critical

## 4. Deployment & Security

*   **Environment Variables**: API keys (`AIRTABLE_API_KEY`, `OPENAI_API_KEY`) are stored in `.env.local` and Vercel Project Settings.
*   **Typecasting**: Airtable write operations use `{ typecast: true }` to robustly handle Single Select field values.
*   **Error Handling**: The scheduler uses per-record try-catch blocks to prevent a single bad record from halting the entire batch processing.
