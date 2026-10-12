const { GoogleGenAI } = require("@google/genai");
const logger = require("../config/logger");

const apiKey = process.env.GEMINI_API_KEY;
let aiClient = null;
if (apiKey) {
  aiClient = new GoogleGenAI({ apiKey });
}

// Google Gemini embedding models to try in order of preference
const EMBEDDING_MODELS = [
  "text-embedding-004",
  "gemini-embedding-001",
  "embedding-001",
];
const EMBEDDING_DIMENSION = 768;

/**
 * Generate a single 768-dimension vector embedding for text with automatic fallback & retry.
 *
 * @param {string} text - The input string to embed
 * @returns {Promise<number[]>} Array of 768 floating point numbers
 */
async function generateEmbedding(text) {
  if (!text || typeof text !== "string" || !text.trim()) {
    return [];
  }

  if (!aiClient) {
    logger.warn("[EmbeddingService] GEMINI_API_KEY is not configured.");
    return [];
  }

  const cleanText = text.trim();
  let lastError = null;

  for (const modelName of EMBEDDING_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await aiClient.models.embedContent({
          model: modelName,
          contents: cleanText,
          config: {
            outputDimensionality: EMBEDDING_DIMENSION,
          },
        });

        const values =
          response.embeddings?.[0]?.values || response.embedding?.values;
        if (values && Array.isArray(values) && values.length > 0) {
          return values;
        }
      } catch (error) {
        lastError = error;
        // Brief pause before retry
        await new Promise((r) => setTimeout(r, 200 * attempt));
      }
    }
  }

  logger.warn(
    `[EmbeddingService] All embedding models failed: ${lastError?.message}`,
  );
  return [];
}

/**
 * Generate embeddings for an array of texts in batch.
 *
 * @param {string[]} textArray - Array of strings to embed
 * @returns {Promise<number[][]>} Array of 768-dimension vector arrays
 */
async function generateBatchEmbeddings(textArray) {
  if (!textArray || !textArray.length) {
    return [];
  }

  if (!aiClient) {
    logger.warn("[EmbeddingService] GEMINI_API_KEY is not configured.");
    return textArray.map(() => []);
  }

  // Filter out empty strings but keep index alignment
  const validTexts = textArray.map((t) =>
    t && typeof t === "string" ? t.trim() : "",
  );

  try {
    // Gemini embedContent accepts array of strings in contents for batching
    const response = await aiClient.models.embedContent({
      model: EMBEDDING_MODELS[0] || "text-embedding-004",
      contents: validTexts,
      config: {
        outputDimensionality: EMBEDDING_DIMENSION,
      },
    });

    if (response.embeddings && Array.isArray(response.embeddings)) {
      return response.embeddings.map((e) => e.values || []);
    }

    // Fallback if batch format differs
    return await Promise.all(validTexts.map((t) => generateEmbedding(t)));
  } catch (error) {
    const results = [];
    for (const t of validTexts) {
      results.push(await generateEmbedding(t));
    }
    return results;
  }
}

/**
 * Calculates cosine similarity between two numeric vectors.
 *
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number} Score between -1 and 1 (typically 0.0 to 1.0 for normalized embeddings)
 */
function cosineSimilarity(vecA, vecB) {
  if (
    !vecA ||
    !vecB ||
    !vecA.length ||
    !vecB.length ||
    vecA.length !== vecB.length
  ) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

module.exports = {
  generateEmbedding,
  generateBatchEmbeddings,
  cosineSimilarity,
  EMBEDDING_MODELS,
  EMBEDDING_DIMENSION,
};
