const { qdrantClient, DEFAULT_COLLECTION } = require("../config/qdrant");
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
    const searchParams = {
      vector: queryVector,
      limit: topK,
      with_payload: true,
      score_threshold: scoreThreshold,
    };

    // Apply Qdrant payload filter if category is specified
    if (category && category !== "all") {
      searchParams.filter = {
        must: [
          {
            key: "category",
            match: { value: category },
          },
        ],
      };
    }

    const results = await qdrantClient.search(collectionName, searchParams);

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
  getCollectionStats,
};
