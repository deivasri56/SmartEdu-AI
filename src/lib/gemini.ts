// src/lib/gemini.ts — Server-only Gemini AI client with retry & fallback
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.warn(
    "⚠️  GEMINI_API_KEY is not set. AI features will return fallback responses."
  );
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// Models to try in order — if the primary is rate-limited, fall back to the next
const MODEL_CHAIN = ["gemini-3.6-flash", "gemini-3.5-flash"];

/**
 * Sleep helper for retry backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a response from Gemini AI with automatic retry and model fallback.
 * - Retries up to 3 times per model with exponential backoff on 429/503 errors
 * - Falls back to the next model in the chain if all retries fail
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

  let lastError: any = null;

  for (const modelName of MODEL_CHAIN) {
    const MAX_RETRIES = 3;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
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
      } catch (err: any) {
        lastError = err;
        const status = err?.status || err?.statusCode;
        const isRetryable = status === 429 || status === 503;

        if (isRetryable && attempt < MAX_RETRIES - 1) {
          // Parse retry delay from error if available, otherwise use exponential backoff
          let waitMs = Math.min(2000 * Math.pow(2, attempt), 60000);

          // Try to extract retryDelay from the error details
          const retryMatch = err?.message?.match(/retry in (\d+(\.\d+)?)s/i);
          if (retryMatch) {
            waitMs = Math.ceil(parseFloat(retryMatch[1]) * 1000);
          }

          console.warn(
            `[Gemini] ${modelName} attempt ${attempt + 1}/${MAX_RETRIES} hit ${status}. Retrying in ${Math.round(waitMs / 1000)}s...`
          );
          await sleep(waitMs);
          continue;
        }

        if (isRetryable) {
          // All retries exhausted for this model, try the next one
          console.warn(
            `[Gemini] ${modelName} exhausted all ${MAX_RETRIES} retries. Trying next model...`
          );
          break;
        }

        // Non-retryable error (e.g. 400, 404), throw immediately
        throw err;
      }
    }
  }

  // All models and retries exhausted
  throw lastError || new Error("All Gemini AI models are currently unavailable. Please try again later.");
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
