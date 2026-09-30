const logger = require("../config/logger");

const DEFAULT_PRIMARY_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const DEFAULT_LITE_MODEL = process.env.GEMINI_LITE_MODEL || "gemini-2.5-flash-lite";

// Primary and alternative fallback models
const FALLBACK_CHAIN = [
  DEFAULT_PRIMARY_MODEL,
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
];

/**
 * Checks if an error is due to rate limits, high traffic, quota exhaustion, or model deprecation.
 */
function isTransientOrQuotaError(err) {
  if (!err) return false;
  const msg = (err.message || "").toLowerCase();
  const status = err.status || err.statusCode || err.code;

  return (
    status === 429 ||
    status === 503 ||
    status === 500 ||
    status === "RESOURCE_EXHAUSTED" ||
    status === "UNAVAILABLE" ||
    msg.includes("quota") ||
    msg.includes("429") ||
    msg.includes("503") ||
    msg.includes("overloaded") ||
    msg.includes("high traffic") ||
    msg.includes("resource has been exhausted") ||
    msg.includes("rate limit") ||
    msg.includes("not found") ||
    msg.includes("is deprecated") ||
    msg.includes("shut down")
  );
}

/**
 * Executes a Gemini generateContent call with automatic retry and model fallback.
 *
 * @param {Object} aiClient - Initialized GoogleGenAI client instance
 * @param {Object} options
 * @param {string} [options.model] - Target Gemini model endpoint
 * @param {Array|Object} options.contents - Prompt/conversation contents
 * @param {Object} [options.config] - Gemini configuration options (temperature, systemInstruction, tools, etc.)
 * @param {Array<string>} [options.fallbackModels] - Custom list of fallback models
 * @returns {Promise<Object>} Gemini API response object
 */
async function generateContentWithFallback(aiClient, { model, contents, config, fallbackModels }) {
  if (!aiClient) {
    throw new Error("Google GenAI client is not initialized.");
  }

  const requestedModel = model || process.env.GEMINI_MODEL || DEFAULT_PRIMARY_MODEL;
  const modelsToTry = [
    requestedModel,
    ...(fallbackModels || FALLBACK_CHAIN),
  ];

  // Unique models list preserving order
  const uniqueModels = [...new Set(modelsToTry.filter(Boolean))];

  let lastError = null;
  for (let i = 0; i < uniqueModels.length; i++) {
    const currentModel = uniqueModels[i];
    try {
      if (i > 0) {
        logger.info(`[GeminiHelper] Attempting fallback model '${currentModel}' (strategy ${i + 1}/${uniqueModels.length})...`);
      }

      const response = await aiClient.models.generateContent({
        model: currentModel,
        contents,
        config,
      });

      return response;
    } catch (err) {
      lastError = err;
      logger.warn(`[GeminiHelper] Error calling model '${currentModel}': ${err.message}`);

      // If it's a fatal validation error unrelated to quota/concurrency/model availability, stop early
      if (!isTransientOrQuotaError(err) && !err.message.includes("404") && !err.message.includes("not found")) {
        throw err;
      }

      // Exponential backoff pause between model switches (300ms, 600ms, ...)
      await new Promise((resolve) => setTimeout(resolve, 300 * (i + 1)));
    }
  }

  throw lastError || new Error("All Gemini models in fallback chain failed.");
}

module.exports = {
  DEFAULT_PRIMARY_MODEL,
  DEFAULT_LITE_MODEL,
  FALLBACK_CHAIN,
  generateContentWithFallback,
};
