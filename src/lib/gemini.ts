// src/lib/gemini.ts — Server-only Gemini AI client
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.warn(
    "⚠️  GEMINI_API_KEY is not set. AI features will return fallback responses."
  );
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/**
 * Generate a response from Gemini AI.
 * @param systemPrompt - System instructions (role, output format, etc.)
 * @param userPrompt - The user's query or data payload
 * @returns The AI response text
 */
export async function generateAIResponse(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY is not configured. Please add a valid API key to .env");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-3.6-flash",
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 2048,
    },
  });

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ],
    systemInstruction: {
      role: "system",
      parts: [{ text: systemPrompt }],
    },
  });

  const response = result.response;
  return response.text();
}

/**
 * Generate a structured JSON response from Gemini AI.
 * Parses the response as JSON with fallback error handling.
 */
export async function generateStructuredAIResponse<T>(
  systemPrompt: string,
  userPrompt: string
): Promise<T> {
  const text = await generateAIResponse(systemPrompt, userPrompt);

  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    console.error("Failed to parse AI JSON response:", cleaned.substring(0, 200));
    throw new Error("AI returned an invalid response format. Please try again.");
  }
}
