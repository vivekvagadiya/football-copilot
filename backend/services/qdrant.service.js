const {
  qdrantClient,
  DEFAULT_COLLECTION,
  FACTS_MEMORY_COLLECTION,
  EPISODIC_MEMORY_COLLECTION,
} = require("../config/qdrant");
const logger = require("../config/logger");

/**
 * Converts a 24-character MongoDB ObjectId into a valid 36-character UUID string for Qdrant point ID compliance.
 *
 * @param {string|Object} mongoId - MongoDB ObjectId
 * @param {number} [chunkIndex=0] - Optional chunk index offset
 * @returns {string} 36-character UUID string
 */
function mongoIdToUuid(mongoId, chunkIndex = 0) {
  const str = mongoId ? mongoId.toString() : "000000000000000000000000";
  // Add chunk index hex padding if available
  const suffix = chunkIndex.toString(16).padStart(8, "0");
  const fullHex = (str + suffix).slice(0, 32).padEnd(32, "0");

  return [
    fullHex.slice(0, 8),
    fullHex.slice(8, 12),
    fullHex.slice(12, 16),
    fullHex.slice(16, 20),
    fullHex.slice(20, 32),
  ].join("-");
}

/**
 * Upsert knowledge chunks with vectors into Qdrant collection.
 *
 * @param {Array<Object>} chunks - Array of chunk objects containing documentId, chunkIndex, content, embedding, metadata
 * @param {string} [collectionName=DEFAULT_COLLECTION]
 * @returns {Promise<boolean>}
 */
async function upsertChunkVectors(chunks = [], collectionName = DEFAULT_COLLECTION) {
  if (!chunks || chunks.length === 0) return true;

  try {
    const points = chunks
      .filter((c) => c.embedding && Array.isArray(c.embedding) && c.embedding.length > 0)
      .map((c) => {
        const pointId = mongoIdToUuid(c._id || c.documentId, c.chunkIndex || 0);

        return {
          id: pointId,
          vector: c.embedding,
          payload: {
            mongoChunkId: c._id ? c._id.toString() : null,
            documentId: c.documentId ? c.documentId.toString() : null,
            chunkIndex: c.chunkIndex ?? 0,
            title: c.title || "Untitled Document",
            category: c.category || "general",
            source: c.source || "Manual Ingestion",
            author: c.author || "Football Copilot Editorial",
            content: c.content || "",
            tokenEstimate: c.tokenEstimate || 0,
            keywords: c.keywords || [],
          },
        };
      });

    if (points.length === 0) {
      logger.warn("[QdrantService] No valid embeddings provided for upsert.");
      return false;
    }

    await qdrantClient.upsert(collectionName, {
      wait: true,
      points,
    });

    logger.info(`[QdrantService] Successfully upserted ${points.length} vector points into '${collectionName}'.`);
    return true;
  } catch (error) {
    logger.error(`[QdrantService] Error upserting chunk vectors: ${error.message}`, error);
    return false;
  }
}

/**
 * Helper to query Qdrant using the unified query API (v1.19+) or fallback search method.
 */
async function executeVectorQuery(collectionName, { vector, limit = 4, scoreThreshold = 0.35, filter = null }) {
  if (!vector || !Array.isArray(vector) || vector.length === 0) return [];

  const queryParams = {
    limit,
    with_payload: true,
    score_threshold: scoreThreshold,
  };

  if (filter) {
    queryParams.filter = filter;
  }

  if (typeof qdrantClient.query === "function") {
    const response = await qdrantClient.query(collectionName, {
      query: vector,
      ...queryParams,
    });
    return response?.points || (Array.isArray(response) ? response : []);
  } else if (typeof qdrantClient.search === "function") {
    return await qdrantClient.search(collectionName, {
      vector,
      ...queryParams,
    });
  }

  return [];
}

/**
 * Search nearest vector chunks in Qdrant matching a query vector.
 *
 * @param {Object} params
 * @param {number[]} params.queryVector - 768-dim query embedding vector
 * @param {string} [params.category] - Optional category payload filter
 * @param {number} [params.topK=4] - Max results to return
 * @param {number} [params.scoreThreshold=0.35] - Minimum cosine similarity score threshold
 * @param {string} [collectionName=DEFAULT_COLLECTION]
 * @returns {Promise<Array<Object>>} Ranked relevant chunks with payload metadata and score
 */
async function searchKnowledgeVectors(
  { queryVector, category, topK = 4, scoreThreshold = 0.35 },
  collectionName = DEFAULT_COLLECTION
) {
  if (!queryVector || !Array.isArray(queryVector) || queryVector.length === 0) {
    return [];
  }

  try {
    let filter = null;
    if (category && category !== "all") {
      filter = {
        must: [
          {
            key: "category",
            match: { value: category },
          },
        ],
      };
    }

    const results = await executeVectorQuery(collectionName, {
      vector: queryVector,
      limit: topK,
      scoreThreshold,
      filter,
    });

    if (!results || results.length === 0) {
      return [];
    }

    logger.info(`[QdrantService] Vector query retrieved ${results.length} chunks (top score: ${results[0]?.score?.toFixed(3)})`);

    return results.map((item) => ({
      _id: item.payload?.mongoChunkId || item.id,
      documentId: item.payload?.documentId,
      chunkIndex: item.payload?.chunkIndex,
      title: item.payload?.title,
      category: item.payload?.category,
      source: item.payload?.source,
      author: item.payload?.author,
      content: item.payload?.content,
      tokenEstimate: item.payload?.tokenEstimate,
      score: item.score,
    }));
  } catch (error) {
    logger.warn(`[QdrantService] Search error: ${error.message}`);
    return [];
  }
}

/**
 * Delete vectors matching a specific document ID from Qdrant.
 *
 * @param {string} documentId - MongoDB Document ID
 * @param {string} [collectionName=DEFAULT_COLLECTION]
 * @returns {Promise<boolean>}
 */
async function deleteDocumentVectors(documentId, collectionName = DEFAULT_COLLECTION) {
  if (!documentId) return false;

  try {
    await qdrantClient.delete(collectionName, {
      filter: {
        must: [
          {
            key: "documentId",
            match: { value: documentId.toString() },
          },
        ],
      },
    });

    logger.info(`[QdrantService] Deleted vectors for documentId '${documentId}' from '${collectionName}'.`);
    return true;
  } catch (error) {
    logger.error(`[QdrantService] Error deleting document vectors: ${error.message}`, error);
    return false;
  }
}

/**
 * Upserts a single user semantic fact into Qdrant.
 *
 * @param {Object} params
 * @param {string} params.memoryId - MongoDB UserMemory ObjectId
 * @param {string} params.userId - User ObjectId
 * @param {string} params.fact - Memory fact string
 * @param {string} params.category - Memory category
 * @param {number[]} params.embedding - 768-dim vector
 * @returns {Promise<string|null>} Generated UUID point ID
 */
async function upsertUserFactVector({ memoryId, userId, fact, category, embedding }) {
  if (!memoryId || !userId || !fact || !embedding || embedding.length === 0) return null;

  try {
    const pointId = mongoIdToUuid(memoryId);
    await qdrantClient.upsert(FACTS_MEMORY_COLLECTION, {
      wait: true,
      points: [
        {
          id: pointId,
          vector: embedding,
          payload: {
            memoryId: memoryId.toString(),
            userId: userId.toString(),
            category: category || "general",
            fact,
            updatedAt: new Date().toISOString(),
          },
        },
      ],
    });

    logger.info(`[QdrantService] Upserted memory point '${pointId}' for user '${userId}'.`);
    return pointId;
  } catch (error) {
    logger.warn(`[QdrantService] Failed to upsert user fact vector: ${error.message}`);
    return null;
  }
}

/**
 * Searches semantic user facts in Qdrant matching a query vector for a specific user.
 *
 * @param {Object} params
 * @param {string} params.userId - Target user ID (tenant filter)
 * @param {number[]} params.queryVector - 768-dim query vector
 * @param {string} [params.category] - Optional category filter
 * @param {number} [params.limit=5]
 * @param {number} [params.scoreThreshold=0.38]
 * @returns {Promise<Array<Object>>}
 */
async function searchUserFacts({ userId, queryVector, category, limit = 5, scoreThreshold = 0.38 }) {
  if (!userId || !queryVector || queryVector.length === 0) return [];

  try {
    const mustFilters = [
      {
        key: "userId",
        match: { value: userId.toString() },
      },
    ];

    if (category && category !== "all") {
      mustFilters.push({
        key: "category",
        match: { value: category },
      });
    }

    const results = await executeVectorQuery(FACTS_MEMORY_COLLECTION, {
      vector: queryVector,
      limit,
      scoreThreshold,
      filter: { must: mustFilters },
    });

    return results.map((item) => ({
      memoryId: item.payload?.memoryId || item.id,
      fact: item.payload?.fact,
      category: item.payload?.category,
      score: item.score,
    }));
  } catch (error) {
    logger.warn(`[QdrantService] User facts search error: ${error.message}`);
    return [];
  }
}

/**
 * Deletes a specific user fact from Qdrant by memory ID.
 */
async function deleteUserFactVector(memoryId) {
  if (!memoryId) return false;
  try {
    const pointId = mongoIdToUuid(memoryId);
    await qdrantClient.delete(FACTS_MEMORY_COLLECTION, {
      points: [pointId],
    });
    return true;
  } catch (error) {
    logger.warn(`[QdrantService] Error deleting memory point: ${error.message}`);
    return false;
  }
}

/**
 * Upserts a conversation episodic summary into Qdrant.
 */
async function upsertUserEpisodicVector({ conversationId, userId, summary, keyTopics = [], embedding }) {
  if (!conversationId || !userId || !summary || !embedding || embedding.length === 0) return null;

  try {
    const pointId = mongoIdToUuid(conversationId);
    await qdrantClient.upsert(EPISODIC_MEMORY_COLLECTION, {
      wait: true,
      points: [
        {
          id: pointId,
          vector: embedding,
          payload: {
            conversationId: conversationId.toString(),
            userId: userId.toString(),
            summary,
            keyTopics,
            updatedAt: new Date().toISOString(),
          },
        },
      ],
    });

    logger.info(`[QdrantService] Upserted episodic memory for conv '${conversationId}'.`);
    return pointId;
  } catch (error) {
    logger.warn(`[QdrantService] Failed to upsert episodic vector: ${error.message}`);
    return null;
  }
}

/**
 * Searches episodic past conversation memories for a user.
 */
async function searchUserEpisodicMemories({ userId, queryVector, limit = 3, scoreThreshold = 0.35 }) {
  if (!userId || !queryVector || queryVector.length === 0) return [];

  try {
    const results = await executeVectorQuery(EPISODIC_MEMORY_COLLECTION, {
      vector: queryVector,
      limit,
      scoreThreshold,
      filter: {
        must: [
          {
            key: "userId",
            match: { value: userId.toString() },
          },
        ],
      },
    });

    return results.map((item) => ({
      conversationId: item.payload?.conversationId,
      summary: item.payload?.summary,
      keyTopics: item.payload?.keyTopics || [],
      score: item.score,
    }));
  } catch (error) {
    logger.warn(`[QdrantService] Episodic memories search error: ${error.message}`);
    return [];
  }
}

/**
 * Wipes all vector points associated with a user across all memory collections (GDPR compliance).
 */
async function clearAllUserVectors(userId) {
  if (!userId) return false;
  try {
    const filter = {
      filter: {
        must: [
          {
            key: "userId",
            match: { value: userId.toString() },
          },
        ],
      },
    };

    await Promise.all([
      qdrantClient.delete(FACTS_MEMORY_COLLECTION, filter),
      qdrantClient.delete(EPISODIC_MEMORY_COLLECTION, filter),
    ]);

    logger.info(`[QdrantService] Cleared all memory vectors for user '${userId}'.`);
    return true;
  } catch (error) {
    logger.error(`[QdrantService] Error clearing user vectors: ${error.message}`);
    return false;
  }
}

/**
 * Get collection status and statistics.
 *
 * @param {string} [collectionName=DEFAULT_COLLECTION]
 * @returns {Promise<Object>}
 */
async function getCollectionStats(collectionName = DEFAULT_COLLECTION) {
  try {
    const info = await qdrantClient.getCollection(collectionName);
    return {
      status: info.status,
      vectorsCount: info.vectors_count ?? info.points_count ?? 0,
      pointsCount: info.points_count ?? 0,
      segmentsCount: info.segments_count ?? 0,
      config: info.config,
    };
  } catch (error) {
    return {
      status: "unavailable",
      error: error.message,
    };
  }
}

module.exports = {
  mongoIdToUuid,
  upsertChunkVectors,
  searchKnowledgeVectors,
  deleteDocumentVectors,
  upsertUserFactVector,
  searchUserFacts,
  deleteUserFactVector,
  upsertUserEpisodicVector,
  searchUserEpisodicMemories,
  clearAllUserVectors,
  getCollectionStats,
};
