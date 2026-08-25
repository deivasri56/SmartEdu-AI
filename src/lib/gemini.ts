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
    model: "gemini-3.5-flash",
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
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

  // Strip markdown code fences if present using a robust regex
  let cleaned = text.trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (e: any) {
    console.error("Failed to parse AI JSON response. Length:", cleaned.length, "Error:", e.message);
    console.error("Raw cleaned content:", cleaned);
    throw new Error("AI returned an invalid response format. Please try again.");
  }
}
