const { GoogleGenAI } = require("@google/genai");
const KnowledgeDocument = require("../models/knowledgeDocument.model");
const KnowledgeChunk = require("../models/knowledgeChunk.model");
const { splitTextIntoChunks, extractKeywords } = require("../utils/chunker.util");
const {
  generateEmbedding,
  generateBatchEmbeddings,
  cosineSimilarity,
} = require("./embedding.service");
const logger = require("../config/logger");

const apiKey = process.env.GEMINI_API_KEY;
let aiClient = null;
if (apiKey) {
  aiClient = new GoogleGenAI({ apiKey });
}

const RAG_SYSTEM_INSTRUCTION = `You are Football Copilot's specialized RAG (Retrieval-Augmented Generation) Intelligence Engine.
Your objective is to provide highly accurate, comprehensive, and grounded football analysis based on the retrieved context documents provided to you.

Instructions:
1. Rely primarily on the provided RETRIEVED CONTEXT DOCUMENTS to formulate your answer.
2. When referencing specific facts, tactical systems, rules, or historical matches from the context, include citations using format [Doc: "<Title>", Chunk #<Index>].
3. If the context contains sufficient information, deliver a rich, structured, and insightful breakdown using Markdown (headers, bullet points, tactical breakdowns).
4. If the retrieved context is only partially relevant, synthesize what is provided and supplement with your sports domain intelligence while maintaining factual integrity.
5. If the question cannot be answered or is completely unrelated to football/sports, state it clearly and politely guide the user.`;

/**
 * Ingests a new document into the knowledge base by chunking and indexing it.
 *
 * @param {Object} docData
 * @param {string} docData.title - Document title
 * @param {string} docData.category - Category (tactics, rules, history, scouting, news, general)
 * @param {string} docData.rawContent - Full text content
 * @param {string} [docData.source] - Document source
 * @param {string} [docData.author] - Author name
 * @param {string[]} [docData.tags] - Relevant tags
 * @param {Object} [docData.metadata] - Extra metadata key-values
 * @param {string} [docData.createdBy] - User ID who ingested the doc
 * @param {Object} [options] - Chunking options
 * @returns {Promise<Object>} Created document with chunk summary
 */
async function ingestDocument(docData, options = {}) {
  try {
    const {
      title,
      category = "general",
      rawContent,
      source = "Manual Ingestion",
      author = "Football Copilot Editorial",
      tags = [],
      metadata = {},
      createdBy = null,
    } = docData;

    if (!title || !rawContent) {
      throw new Error("Title and rawContent are required for document ingestion.");
    }

    // Split content into overlapping chunks
    const chunks = splitTextIntoChunks(rawContent, options);

    // Merge document tags with auto-extracted keywords from entire document
    const extractedDocKeywords = extractKeywords(rawContent, 10);
    const combinedTags = Array.from(
      new Set([
        ...tags.map((t) => t.toLowerCase().trim()),
        ...extractedDocKeywords,
      ])
    ).filter(Boolean);

    // Generate embeddings for chunks in batch
    let embeddings = [];
    try {
      embeddings = await generateBatchEmbeddings(chunks.map((c) => c.content));
    } catch (embedErr) {
      logger.warn(`[RAG] Failed to generate embeddings during ingestion: ${embedErr.message}`);
    }

    const chunksWithEmbeddings = chunks.map((chunk, idx) => ({
      ...chunk,
      embedding: embeddings[idx] || [],
    }));

    const document = new KnowledgeDocument({
      title,
      category,
      source,
      author,
      tags: combinedTags,
      metadata,
      rawContent,
      chunks: chunksWithEmbeddings,
      chunkCount: chunksWithEmbeddings.length,
      createdBy,
    });

    const savedDoc = await document.save();

    // Also index into flat KnowledgeChunk collection for fast MongoDB Atlas Vector Search
    try {
      const flatChunks = chunksWithEmbeddings.map((chunk) => ({
        documentId: savedDoc._id,
        chunkIndex: chunk.chunkIndex,
        title: savedDoc.title,
        category: savedDoc.category,
        source: savedDoc.source,
        author: savedDoc.author,
        content: chunk.content,
        tokenEstimate: chunk.tokenEstimate,
        keywords: chunk.keywords,
        embedding: chunk.embedding,
      }));

      if (flatChunks.length > 0) {
        await KnowledgeChunk.insertMany(flatChunks);
      }
    } catch (chunkErr) {
      logger.error(`[RAG] Error inserting into KnowledgeChunk collection: ${chunkErr.message}`);
    }

    logger.info(
      `[RAG] Successfully ingested document '${title}' with ${chunks.length} chunks and embeddings (ID: ${savedDoc._id})`
    );

    return {
      success: true,
      documentId: savedDoc._id,
      title: savedDoc.title,
      category: savedDoc.category,
      chunkCount: savedDoc.chunkCount,
      tags: savedDoc.tags,
    };
  } catch (error) {
    logger.error(`[RAG] Error ingesting document: ${error.message}`, error);
    throw error;
  }
}

/**
 * Fallback keyword-based retrieval when vector search is unavailable or unindexed.
 */
async function fallbackKeywordRetrieval(query, options = {}) {
  const topK = options.topK || 4;
  const categoryFilter = options.category;

  const queryTerms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const filter = {};
  if (categoryFilter && categoryFilter !== "all") {
    filter.category = categoryFilter;
  }

  const documents = await KnowledgeDocument.find(filter).lean();
  if (!documents || documents.length === 0) {
    return [];
  }

  const scoredChunks = [];

  for (const doc of documents) {
    const docTitleLower = doc.title.toLowerCase();
    const docTags = (doc.tags || []).map((t) => t.toLowerCase());

    for (const chunk of doc.chunks || []) {
      let score = 0;
      const chunkContentLower = chunk.content.toLowerCase();
      const chunkKeywords = (chunk.keywords || []).map((k) => k.toLowerCase());

      for (const term of queryTerms) {
        if (chunkContentLower.includes(term)) score += 3;
        if (chunkKeywords.includes(term)) score += 4;
        if (docTitleLower.includes(term)) score += 5;
        if (docTags.includes(term)) score += 2;
      }

      if (score > 0) {
        scoredChunks.push({
          score,
          documentId: doc._id,
          title: doc.title,
          category: doc.category,
          source: doc.source,
          author: doc.author,
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
          tokenEstimate: chunk.tokenEstimate,
        });
      }
    }
  }

  scoredChunks.sort((a, b) => b.score - a.score);
  return scoredChunks.slice(0, topK);
}

/**
 * Retrieves the most relevant knowledge chunks matching a query using:
 * 1. MongoDB Atlas $vectorSearch (HNSW indexed semantic search)
 * 2. In-memory cosine similarity fallback (if $vectorSearch not yet indexed)
 * 3. Keyword-based matching fallback
 *
 * @param {string} query - The search query
 * @param {Object} options - Retrieval options
 * @param {string} [options.category] - Filter by specific category
 * @param {string[]} [options.tags] - Filter by tags
 * @param {number} [options.topK=4] - Max number of chunks to return
 * @returns {Promise<Array<Object>>} Ranked relevant chunks with source metadata
 */
async function retrieveContext(query, options = {}) {
  const topK = options.topK || 4;
  const categoryFilter = options.category;

  if (!query || typeof query !== "string") {
    return [];
  }

  try {
    // 1. Generate embedding for search query
    let queryEmbedding = [];
    try {
      queryEmbedding = await generateEmbedding(query);
    } catch (embedErr) {
      logger.warn(`[RAG] Could not generate query embedding: ${embedErr.message}`);
    }

    // 2. Primary: MongoDB Atlas Vector Search
    if (queryEmbedding && queryEmbedding.length > 0) {
      try {
        const vectorSearchStage = {
          index: "vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: Math.max(50, topK * 10),
          limit: topK,
        };

        if (categoryFilter && categoryFilter !== "all") {
          vectorSearchStage.filter = { category: categoryFilter };
        }

        const pipeline = [
          { $vectorSearch: vectorSearchStage },
          {
            $project: {
              _id: 1,
              documentId: 1,
              chunkIndex: 1,
              title: 1,
              category: 1,
              source: 1,
              author: 1,
              content: 1,
              tokenEstimate: 1,
              score: { $meta: "vectorSearchScore" },
            },
          },
        ];

        const atlasResults = await KnowledgeChunk.aggregate(pipeline);
        if (atlasResults && atlasResults.length > 0) {
          logger.info(
            `[RAG] Atlas $vectorSearch retrieved ${atlasResults.length} chunks (top score: ${atlasResults[0]?.score?.toFixed(3) || 0})`
          );
          return atlasResults;
        }
      } catch (atlasErr) {
        logger.warn(
          `[RAG] Atlas $vectorSearch unavailable (${atlasErr.message}). Falling back to in-memory/keyword search.`
        );
      }

      // 3. Fallback: In-memory cosine similarity over KnowledgeChunk records
      try {
        const filter = {};
        if (categoryFilter && categoryFilter !== "all") {
          filter.category = categoryFilter;
        }

        const chunks = await KnowledgeChunk.find(filter)
          .select("documentId chunkIndex title category source author content tokenEstimate embedding")
          .limit(200)
          .lean();

        if (chunks && chunks.length > 0) {
          const scored = [];
          for (const chunk of chunks) {
            if (!chunk.embedding || !chunk.embedding.length) continue;
            const sim = cosineSimilarity(queryEmbedding, chunk.embedding);
            // Minimum semantic relevance threshold
            if (sim >= 0.40) {
              scored.push({
                score: sim,
                documentId: chunk.documentId,
                title: chunk.title,
                category: chunk.category,
                source: chunk.source,
                author: chunk.author,
                chunkIndex: chunk.chunkIndex,
                content: chunk.content,
                tokenEstimate: chunk.tokenEstimate,
              });
            }
          }

          if (scored.length > 0) {
            scored.sort((a, b) => b.score - a.score);
            const topChunks = scored.slice(0, topK);
            logger.info(
              `[RAG] In-memory cosine similarity retrieved ${topChunks.length} chunks (top score: ${topChunks[0]?.score?.toFixed(3)})`
            );
            return topChunks;
          }
        }
      } catch (memErr) {
        logger.warn(`[RAG] In-memory semantic search error: ${memErr.message}`);
      }
    }

    // 4. Ultimate Fallback: Keyword search
    logger.info(`[RAG] Executing keyword fallback retrieval for query: "${query}"`);
    return await fallbackKeywordRetrieval(query, options);
  } catch (error) {
    logger.error(`[RAG] Error during context retrieval: ${error.message}`, error);
    return [];
  }
}

/**
 * Executes a full RAG query: retrieves relevant context and generates an augmented answer.
 *
 * @param {string} query - The user's question
 * @param {Array<{sender: string, text: string}>} [history=[]] - Conversation history
 * @param {Object} [options={}] - Options (category, topK, model)
 * @returns {Promise<Object>} Augmented answer, source citations, and retrieved chunks
 */
async function generateRAGResponse(query, history = [], options = {}) {
  if (!aiClient) {
    throw new Error("Gemini API key is not configured in backend environment.");
  }

  // 1. Retrieve relevant context chunks
  const retrievedChunks = await retrieveContext(query, options);

  // 2. Build augmented context text
  let contextBlock = "";
  if (retrievedChunks.length > 0) {
    contextBlock = retrievedChunks
      .map(
        (chunk, idx) =>
          `[Document ${idx + 1}: "${chunk.title}", Chunk #${chunk.chunkIndex} | Category: ${chunk.category} | Source: ${chunk.source}]\n${chunk.content}`
      )
      .join("\n\n---\n\n");
  } else {
    contextBlock = "No specific reference documents found in the current knowledge base.";
  }

  // 3. Construct prompt
  const augmentedPrompt = `RETRIEVED CONTEXT DOCUMENTS:
${contextBlock}

USER QUERY:
${query}

Please answer the user query accurately using the retrieved context above where applicable, citing sources using [Doc: "<Title>", Chunk #<Index>].`;

  // 4. Format conversation history
  const contents = [];
  if (Array.isArray(history) && history.length > 0) {
    history.forEach((msg) => {
      if (!msg.text) return;
      const role = msg.sender === "user" ? "user" : "model";
      contents.push({
        role,
        parts: [{ text: msg.text }],
      });
    });
  }

  contents.push({
    role: "user",
    parts: [{ text: augmentedPrompt }],
  });

  const selectedModel = process.env.GEMINI_MODEL || "gemini-2.0-flash";

  try {
    const response = await aiClient.models.generateContent({
      model: selectedModel,
      contents,
      config: {
        systemInstruction: RAG_SYSTEM_INSTRUCTION,
        temperature: 0.4, // lower temperature for grounded factual consistency
        maxOutputTokens: 1000,
      },
    });

    const answerText = response.text || "No response generated.";

    // Deduplicate sources for clean frontend presentation
    const uniqueSources = [];
    const seenDocs = new Set();

    for (const chunk of retrievedChunks) {
      if (!seenDocs.has(chunk.documentId.toString())) {
        seenDocs.add(chunk.documentId.toString());
        uniqueSources.push({
          documentId: chunk.documentId,
          title: chunk.title,
          category: chunk.category,
          source: chunk.source,
          author: chunk.author,
        });
      }
    }

    return {
      answer: answerText,
      sources: uniqueSources,
      retrievedChunksCount: retrievedChunks.length,
      chunks: retrievedChunks.map((c) => ({
        title: c.title,
        chunkIndex: c.chunkIndex,
        category: c.category,
        snippet: c.content.slice(0, 150) + "...",
        score: c.score,
      })),
    };
  } catch (error) {
    logger.error(`[RAG] Error generating RAG response: ${error.message}`, error);
    throw error;
  }
}

/**
 * List all knowledge documents with pagination and category filtering.
 */
async function listDocuments({ category, page = 1, limit = 20, search }) {
  const query = {};
  if (category && category !== "all") {
    query.category = category;
  }
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search, "i")] } },
    ];
  }

  const skip = (page - 1) * limit;
  const [documents, total] = await Promise.all([
    KnowledgeDocument.find(query)
      .select("-rawContent -chunks.content")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    KnowledgeDocument.countDocuments(query),
  ]);

  return {
    documents,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get single knowledge document by ID including full chunks.
 */
async function getDocumentById(id) {
  return await KnowledgeDocument.findById(id).lean();
}

/**
 * Delete a knowledge document and its chunks.
 */
async function deleteDocument(id) {
  const [deletedDoc] = await Promise.all([
    KnowledgeDocument.findByIdAndDelete(id),
    KnowledgeChunk.deleteMany({ documentId: id }),
  ]);
  return deletedDoc;
}

module.exports = {
  ingestDocument,
  retrieveContext,
  generateRAGResponse,
  listDocuments,
  getDocumentById,
  deleteDocument,
};
