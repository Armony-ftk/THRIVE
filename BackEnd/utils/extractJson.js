const { createApiError } = require("../utils/apiErrorHandler");

function findJsonBlock(text) {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    return codeBlockMatch[1].trim();
  }

  const openBrace = text.indexOf("{");
  const closeBrace = text.lastIndexOf("}");
  if (openBrace === -1 || closeBrace === -1 || closeBrace <= openBrace) {
    throw createApiError(500, "Could not find a valid JSON object in the AI response.");
  }

  return text.slice(openBrace, closeBrace + 1).trim();
}

function extractJson(rawText) {
  if (typeof rawText !== "string") {
    throw createApiError(500, "AI response was not text.");
  }

  const cleanedText = rawText.trim();
  const jsonText = findJsonBlock(cleanedText);

  try {
    return JSON.parse(jsonText);
  } catch (error) {
    throw createApiError(
      500,
      `AI response could not be parsed as JSON. ${error.message}`
    );
  }
}

module.exports = {
  extractJson,
};
