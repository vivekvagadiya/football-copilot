const { GoogleGenAI } = require("@google/genai");
const logger = require("../config/logger");

const apiKey = process.env.GEMINI_API_KEY;
let aiClient = null;
if (apiKey) {
  aiClient = new GoogleGenAI({ apiKey });
}

// Google Gemini embedding model and target dimensionality
const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSION = 768;

/**
 * Generate a single 768-dimension vector embedding for text.
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

  try {
    const response = await aiClient.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text.trim(),
      config: {
        outputDimensionality: EMBEDDING_DIMENSION,
      },
    });

    const values = response.embeddings?.[0]?.values || response.embedding?.values;
    if (!values || !Array.isArray(values)) {
      logger.warn("[EmbeddingService] Unexpected embedding response structure");
      return [];
    }

    return values;
  } catch (error) {
    logger.error(`[EmbeddingService] Error generating embedding: ${error.message}`, error);
    return [];
  }
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
  const validTexts = textArray.map((t) => (t && typeof t === "string" ? t.trim() : ""));

  try {
    // Gemini embedContent accepts array of strings in contents for batching
    const response = await aiClient.models.embedContent({
      model: EMBEDDING_MODEL,
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
    logger.warn(`[EmbeddingService] Batch embedContent failed, falling back to sequential: ${error.message}`);
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
  if (!vecA || !vecB || !vecA.length || !vecB.length || vecA.length !== vecB.length) {
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
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSION,
};
