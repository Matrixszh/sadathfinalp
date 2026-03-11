import { getCompletion } from "./openai";

export type Department = "Cardiology" | "Neurology" | "Orthopedics" | "General Medicine" | "Dermatology";
export type Urgency = "Low" | "Medium" | "High" | "Critical";

interface TriageResult {
  department: Department;
  urgency: Urgency;
  confidence: number;
  reasoning: string;
}

type TriageInput = {
  name?: string;
  email?: string;
  phone?: string;
  symptoms: string;
  preferredDate?: string;
  specialty?: string;
};

export async function triageSymptoms(input: TriageInput): Promise<TriageResult> {
  try {
    const payload = {
      name: input.name || "",
      email: input.email || "",
      phone: input.phone || "",
      symptoms: input.symptoms || "",
      preferredDate: input.preferredDate || "",
      specialty: input.specialty || ""
    };
    const prompt = `
Classify the patient into a department and urgency.
Departments: Cardiology, Neurology, Orthopedics, General Medicine, Dermatology.
Urgency: Low, Medium, High, Critical.
Input: ${JSON.stringify(payload)}
Return ONLY JSON: {"department":"...","urgency":"...","reasoning":"..."}
`;
    const response = await getCompletion(prompt);
    if (response) {
      const jsonStr = response.replace(/```json/g, "").replace(/```/g, "").trim();
      const result = JSON.parse(jsonStr);
      return {
        department: result.department,
        urgency: result.urgency,
        confidence: 0.95,
        reasoning: result.reasoning
      };
    }
  } catch (e) {
    console.error("OpenAI triage failed:", e);
  }
  return {
    department: "General Medicine",
    urgency: "Medium",
    confidence: 0.1,
    reasoning: "Fallback"
  };
}
