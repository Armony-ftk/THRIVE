const { GoogleGenAI } = require("@google/genai");
const { createApiError } = require("../utils/apiErrorHandler");
const sleep = require("../utils/sleep");

// Official SDK client initialization
const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = "gemini-2.5-flash";

// Store the client and initialization state
let aiClient = null;
let initialized = false;

// Initialize SDK client once (singleton pattern for efficiency)
function getClient() {
  if (!initialized) {
    if (!API_KEY) {
      throw createApiError(401, "Missing GOOGLE_API_KEY in environment");
    }
    // Initialize the official Gemini SDK with API key
    aiClient = new GoogleGenAI({
      apiKey: API_KEY,
    });
    initialized = true;
  }
  return aiClient;
}

// Extract text safely from SDK response structure
function extractTextFromResponse(response) {
  // The SDK response has this shape: { candidates: [ { content: { parts: [...] } } ] }
  if (!response || !response.candidates || response.candidates.length === 0) {
    throw createApiError(500, "Empty response from Gemini");
  }

  const candidate = response.candidates[0];
  if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
    throw createApiError(500, "No content in Gemini response");
  }

  // Join all text parts (usually just one, but be safe)
  const textParts = candidate.content.parts
    .filter(part => part.text)
    .map(part => part.text);

  if (textParts.length === 0) {
    throw createApiError(500, "No text content in Gemini response");
  }

  return textParts.join(" ").trim();
}

// Map SDK errors to appropriate HTTP status codes
function mapErrorToStatus(error) {
  // SDK errors may have a status field
  if (error.status) return error.status;

  // Fallback: analyze error message for patterns
  const msg = (error.message || "").toLowerCase();
  if (msg.includes("api key") || msg.includes("authentication")) return 401;
  if (msg.includes("permission") || msg.includes("forbidden")) return 403;
  if (msg.includes("quota") || msg.includes("rate limit")) return 429;
  if (msg.includes("unavailable") || msg.includes("overload") || msg.includes("503")) return 503;

  return 500; // Default to server error
}

// Core function: call Gemini with built-in retry logic for 503 errors
async function callGemini(prompt) {
  const client = getClient();

  try {
    // First attempt to generate content
    const response = await client.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2, // Low temperature for consistent, focused responses
        maxOutputTokens: 300,
      },
    });

    return extractTextFromResponse(response);
  } catch (error) {
    const status = mapErrorToStatus(error);

    // RETRY LOGIC: If overloaded (503), wait and retry once
    if (status === 503) {
      console.warn("Gemini overloaded (503). Waiting 10 seconds before retry...");
      await sleep(10000);

      try {
        const retryResponse = await client.models.generateContent({
          model: MODEL,
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 300,
          },
        });

        return extractTextFromResponse(retryResponse);
      } catch (retryError) {
        const retryStatus = mapErrorToStatus(retryError);
        throw createApiError(
          retryStatus,
          `Gemini unavailable after retry: ${retryError.message}`
        );
      }
    }

    // All other errors: throw immediately with mapped status
    throw createApiError(status, error.message || "Gemini API error");
  }
}

// Public reusable function for controllers and future services to call
async function generateContent(prompt) {
  return await callGemini(prompt);
}

// Test function with hardcoded prompt (for initial testing only)
async function generateTestResponse() {
  const prompt = "What is the date going to be in 3 days?";
  return await generateContent(prompt);
}

module.exports = {
  generateContent,
  generateTestResponse,
};

