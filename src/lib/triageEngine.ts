import { getCompletion } from "./openai";

export type Department = "Cardiology" | "Neurology" | "Orthopedics" | "General Medicine" | "Dermatology";
export type Urgency = "Low" | "Medium" | "High" | "Critical";

interface TriageResult {
  department: Department;
  urgency: Urgency;
  confidence: number;
  reasoning: string;
}
const KEYWORD_RULES: Record<string, { department?: Department; urgency?: Urgency }> = {

  /* =========================
     CARDIOLOGY
  ========================= */

  "heart": { department: "Cardiology" },
  "chest pain": { department: "Cardiology", urgency: "Critical" },
  "chest tightness": { department: "Cardiology", urgency: "High" },
  "pressure in chest": { department: "Cardiology", urgency: "High" },
  "palpitations": { department: "Cardiology", urgency: "High" },
  "irregular heartbeat": { department: "Cardiology", urgency: "High" },
  "rapid heartbeat": { department: "Cardiology", urgency: "High" },
  "slow heartbeat": { department: "Cardiology", urgency: "Medium" },
  "arrhythmia": { department: "Cardiology", urgency: "High" },
  "tachycardia": { department: "Cardiology", urgency: "High" },
  "bradycardia": { department: "Cardiology", urgency: "Medium" },
  "shortness of breath": { department: "Cardiology", urgency: "Critical" },
  "sob": { department: "Cardiology", urgency: "Critical" },
  "dyspnea": { department: "Cardiology", urgency: "Critical" },
  "difficulty breathing": { department: "Cardiology", urgency: "Critical" },
  "breathing trouble": { department: "Cardiology", urgency: "Critical" },
  "fainting": { department: "Cardiology", urgency: "High" },
  "syncope": { department: "Cardiology", urgency: "High" },
  "near fainting": { department: "Cardiology", urgency: "High" },
  "swelling legs": { department: "Cardiology", urgency: "Medium" },
  "leg swelling": { department: "Cardiology", urgency: "Medium" },
  "ankle swelling": { department: "Cardiology", urgency: "Medium" },
  "fatigue heart": { department: "Cardiology", urgency: "Medium" },
  "heart murmur": { department: "Cardiology", urgency: "Medium" },
  "high blood pressure": { department: "Cardiology", urgency: "Medium" },
  "hypertension": { department: "Cardiology", urgency: "Medium" },
  "low blood pressure": { department: "Cardiology", urgency: "Medium" },
  "heart attack": { department: "Cardiology", urgency: "Critical" },
  "cardiac arrest": { department: "Cardiology", urgency: "Critical" },
  "angina": { department: "Cardiology", urgency: "High" },
  "tight chest": { department: "Cardiology", urgency: "High" },



  /* =========================
     NEUROLOGY
  ========================= */

  "headache": { department: "Neurology" },
  "migraine": { department: "Neurology", urgency: "Medium" },
  "seizure": { department: "Neurology", urgency: "Critical" },
  "epilepsy": { department: "Neurology", urgency: "Critical" },
  "stroke": { department: "Neurology", urgency: "Critical" },
  "mini stroke": { department: "Neurology", urgency: "Critical" },
  "tia": { department: "Neurology", urgency: "Critical" },
  "numbness": { department: "Neurology", urgency: "High" },
  "tingling": { department: "Neurology", urgency: "Medium" },
  "pins and needles": { department: "Neurology", urgency: "Medium" },
  "dizziness": { department: "Neurology", urgency: "Medium" },
  "vertigo": { department: "Neurology", urgency: "Medium" },
  "confusion": { department: "Neurology", urgency: "High" },
  "memory loss": { department: "Neurology", urgency: "Medium" },
  "weakness": { department: "Neurology", urgency: "Medium" },
  "face drooping": { department: "Neurology", urgency: "Critical" },
  "blurred vision": { department: "Neurology", urgency: "High" },
  "double vision": { department: "Neurology", urgency: "High" },
  "difficulty speaking": { department: "Neurology", urgency: "Critical" },
  "slurred speech": { department: "Neurology", urgency: "Critical" },
  "loss of balance": { department: "Neurology", urgency: "High" },
  "coordination problems": { department: "Neurology", urgency: "Medium" },
  "tremors": { department: "Neurology", urgency: "Medium" },
  "shaking hands": { department: "Neurology", urgency: "Medium" },
  "paralysis": { department: "Neurology", urgency: "Critical" },
  "nerve pain": { department: "Neurology", urgency: "Medium" },
  "sensitivity to light": { department: "Neurology", urgency: "Low" },
  "sensitivity to sound": { department: "Neurology", urgency: "Low" },



  /* =========================
     ORTHOPEDICS
  ========================= */

  "bone": { department: "Orthopedics" },
  "fracture": { department: "Orthopedics", urgency: "High" },
  "broken bone": { department: "Orthopedics", urgency: "High" },
  "joint pain": { department: "Orthopedics", urgency: "Medium" },
  "knee pain": { department: "Orthopedics", urgency: "Medium" },
  "shoulder pain": { department: "Orthopedics", urgency: "Medium" },
  "hip pain": { department: "Orthopedics", urgency: "Medium" },
  "back pain": { department: "Orthopedics", urgency: "Medium" },
  "lower back pain": { department: "Orthopedics", urgency: "Medium" },
  "upper back pain": { department: "Orthopedics", urgency: "Medium" },
  "sprain": { department: "Orthopedics", urgency: "Medium" },
  "muscle strain": { department: "Orthopedics", urgency: "Medium" },
  "ligament tear": { department: "Orthopedics", urgency: "High" },
  "acl tear": { department: "Orthopedics", urgency: "High" },
  "meniscus": { department: "Orthopedics", urgency: "Medium" },
  "stiff joints": { department: "Orthopedics", urgency: "Low" },
  "swollen joint": { department: "Orthopedics", urgency: "Medium" },
  "dislocation": { department: "Orthopedics", urgency: "High" },
  "shoulder dislocation": { department: "Orthopedics", urgency: "High" },
  "wrist pain": { department: "Orthopedics", urgency: "Low" },
  "elbow pain": { department: "Orthopedics", urgency: "Low" },
  "ankle pain": { department: "Orthopedics", urgency: "Low" },
  "foot pain": { department: "Orthopedics", urgency: "Low" },
  "neck pain": { department: "Orthopedics", urgency: "Medium" },
  "spine pain": { department: "Orthopedics", urgency: "Medium" },
  "arthritis": { department: "Orthopedics", urgency: "Low" },
  "joint stiffness": { department: "Orthopedics", urgency: "Low" },



  /* =========================
     DERMATOLOGY
  ========================= */

  "skin": { department: "Dermatology" },
  "rash": { department: "Dermatology", urgency: "Medium" },
  "itch": { department: "Dermatology", urgency: "Low" },
  "itchy skin": { department: "Dermatology", urgency: "Low" },
  "red skin": { department: "Dermatology", urgency: "Low" },
  "dry skin": { department: "Dermatology", urgency: "Low" },
  "acne": { department: "Dermatology", urgency: "Low" },
  "pimple": { department: "Dermatology", urgency: "Low" },
  "eczema": { department: "Dermatology", urgency: "Low" },
  "psoriasis": { department: "Dermatology", urgency: "Medium" },
  "hives": { department: "Dermatology", urgency: "Medium" },
  "blister": { department: "Dermatology", urgency: "Medium" },
  "skin infection": { department: "Dermatology", urgency: "Medium" },
  "fungal infection": { department: "Dermatology", urgency: "Low" },
  "ringworm": { department: "Dermatology", urgency: "Low" },
  "skin peeling": { department: "Dermatology", urgency: "Medium" },
  "sunburn": { department: "Dermatology", urgency: "Low" },
  "skin allergy": { department: "Dermatology", urgency: "Low" },
  "dermatitis": { department: "Dermatology", urgency: "Low" },
  "wart": { department: "Dermatology", urgency: "Low" },
  "mole": { department: "Dermatology", urgency: "Low" },
  "skin lesion": { department: "Dermatology", urgency: "Medium" },
  "pigmentation": { department: "Dermatology", urgency: "Low" },



  /* =========================
     GENERAL MEDICINE
  ========================= */

  "fever": { department: "General Medicine", urgency: "Medium" },
  "high fever": { department: "General Medicine", urgency: "High" },
  "flu": { department: "General Medicine", urgency: "Low" },
  "cough": { department: "General Medicine", urgency: "Low" },
  "dry cough": { department: "General Medicine", urgency: "Low" },
  "wet cough": { department: "General Medicine", urgency: "Low" },
  "cold": { department: "General Medicine", urgency: "Low" },
  "runny nose": { department: "General Medicine", urgency: "Low" },
  "sore throat": { department: "General Medicine", urgency: "Low" },
  "vomiting": { department: "General Medicine", urgency: "Medium" },
  "nausea": { department: "General Medicine", urgency: "Low" },
  "diarrhea": { department: "General Medicine", urgency: "Medium" },
  "stomach pain": { department: "General Medicine", urgency: "Medium" },
  "abdominal pain": { department: "General Medicine", urgency: "Medium" },
  "fatigue": { department: "General Medicine", urgency: "Low" },
  "weakness body": { department: "General Medicine", urgency: "Low" },
  "body ache": { department: "General Medicine", urgency: "Low" },
  "chills": { department: "General Medicine", urgency: "Low" },
  "sweating": { department: "General Medicine", urgency: "Low" },
  "infection": { department: "General Medicine", urgency: "Medium" },
  "checkup": { department: "General Medicine", urgency: "Low" },
  "routine check": { department: "General Medicine", urgency: "Low" }

};
export async function triageSymptoms(symptoms: string): Promise<TriageResult> {
  const lowerSymptoms = symptoms.toLowerCase();
  
  // 1. Keyword Matching
  let detectedDept: Department | undefined;
  let detectedUrgency: Urgency | undefined;
  let matches = 0;

  for (const [keyword, rule] of Object.entries(KEYWORD_RULES)) {
    if (lowerSymptoms.includes(keyword)) {
      if (rule.department) detectedDept = rule.department;
      if (rule.urgency) {
        // Upgrade urgency if higher found (Critical > High > Medium > Low)
        const urgencyLevels = ["Low", "Medium", "High", "Critical"];
        if (!detectedUrgency || urgencyLevels.indexOf(rule.urgency) > urgencyLevels.indexOf(detectedUrgency)) {
          detectedUrgency = rule.urgency;
        }
      }
      matches++;
    }
  }

  // Default fallbacks if partially matched
  if (detectedDept && !detectedUrgency) detectedUrgency = "Medium";
  if (!detectedDept && detectedUrgency) detectedDept = "General Medicine";

  // If we have a confident keyword match, return it
  if (detectedDept && detectedUrgency) {
    return {
      department: detectedDept,
      urgency: detectedUrgency,
      confidence: 0.8, // Keyword match is high confidence but not perfect
      reasoning: "Keyword matching based on symptoms."
    };
  }

  // 2. OpenAI Fallback
  try {
    const prompt = `
      Analyze the following patient symptoms and classify them into one of these departments:
      [Cardiology, Neurology, Orthopedics, General Medicine, Dermatology]
      
      And one of these urgency levels:
      [Low, Medium, High, Critical]
      
      Symptoms: "${symptoms}"
      
      Return ONLY a JSON object: {"department": "...", "urgency": "...", "reasoning": "..."}
    `;

    const response = await getCompletion(prompt);
    if (response) {
      // Clean markdown code blocks if present
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

  // 3. Absolute Fallback
  return {
    department: "General Medicine",
    urgency: "Medium",
    confidence: 0.1,
    reasoning: "Fallback: Unable to classify."
  };
}
