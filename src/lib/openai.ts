import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

export const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function getCompletion(prompt: string) {
  if (!openai) {
    console.warn("OpenAI API key not configured");
    return null;
  }
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI API error:", error);
    return null;
  }
}
