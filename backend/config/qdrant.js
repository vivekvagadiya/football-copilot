const { QdrantClient } = require("@qdrant/js-client-rest");
const logger = require("./logger");

const QDRANT_URL = process.env.QDRANT_URL || "http://127.0.0.1:6333";
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || undefined;
const DEFAULT_COLLECTION = process.env.QDRANT_COLLECTION || "football_knowledge";
const FACTS_MEMORY_COLLECTION = process.env.QDRANT_FACTS_COLLECTION || "user_facts_memory";
const EPISODIC_MEMORY_COLLECTION = process.env.QDRANT_EPISODIC_COLLECTION || "user_episodic_memory";
const VECTOR_SIZE = 768; // Gemini embedding dimension

const qdrantClient = new QdrantClient({
  url: QDRANT_URL,
  apiKey: QDRANT_API_KEY || undefined,
  checkCompatibility: false,
});

/**
 * Ensures the target Qdrant collection exists with the required vector dimensions and distance metric.
 *
 * @param {string} [collectionName=DEFAULT_COLLECTION]
 * @param {number} [vectorSize=VECTOR_SIZE]
 * @returns {Promise<boolean>} True if collection exists or was created successfully
 */
async function ensureQdrantCollection(collectionName = DEFAULT_COLLECTION, vectorSize = VECTOR_SIZE) {
  try {
    const collectionsResponse = await qdrantClient.getCollections();
    const existing = collectionsResponse.collections?.some((col) => col.name === collectionName);

    if (!existing) {
      logger.info(`[QdrantConfig] Creating collection '${collectionName}' (dim: ${vectorSize}, distance: Cosine)...`);
      await qdrantClient.createCollection(collectionName, {
        vectors: {
          size: vectorSize,
          distance: "Cosine",
        },
      });
      logger.info(`[QdrantConfig] Successfully created Qdrant collection '${collectionName}'.`);

      // Create payload indexes if memory collection
      if (collectionName === FACTS_MEMORY_COLLECTION || collectionName === EPISODIC_MEMORY_COLLECTION) {
        try {
          await qdrantClient.createPayloadIndex(collectionName, {
            field_name: "userId",
            field_schema: "keyword",
          });
          logger.info(`[QdrantConfig] Created 'userId' keyword payload index on '${collectionName}'.`);
        } catch (idxErr) {
          logger.warn(`[QdrantConfig] Payload index creation skipped/failed on '${collectionName}': ${idxErr.message}`);
        }
      }
    } else {
      logger.info(`[QdrantConfig] Qdrant collection '${collectionName}' is ready.`);
    }

    return true;
  } catch (error) {
    logger.warn(`[QdrantConfig] Qdrant connection/collection check failed for '${collectionName}': ${error.message}`);
    return false;
  }
}

/**
 * Initializes all required knowledge and memory collections.
 */
async function initAllQdrantCollections() {
  await ensureQdrantCollection(DEFAULT_COLLECTION);
  await ensureQdrantCollection(FACTS_MEMORY_COLLECTION);
  await ensureQdrantCollection(EPISODIC_MEMORY_COLLECTION);
}

module.exports = {
  qdrantClient,
  DEFAULT_COLLECTION,
  FACTS_MEMORY_COLLECTION,
  EPISODIC_MEMORY_COLLECTION,
  VECTOR_SIZE,
  ensureQdrantCollection,
  initAllQdrantCollections,
};
