const asyncHandler = require("../utils/asyncHandler");
const apiResponse = require("../utils/apiResponse");
const aiService = require("../services/ai.service");
const ragService = require("../services/rag.service");
const recommendationService = require("../services/recommendation.service");

const chat = asyncHandler(async (req, res) => {
  const { prompt, history } = req.body;

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return apiResponse.error(res, "Prompt string is required", 400);
  }

  const responseText = await aiService.generateChatResponse(prompt, history || []);

  return apiResponse.success(res, "AI response generated successfully", {
    response: responseText,
  });
});

const getRecommendations = asyncHandler(async (req, res) => {
  const data = await recommendationService.getAIRecommendations(req.user._id);
  return apiResponse.success(res, "AI recommendations fetched successfully", data);
});

// ==================== Sprint 18: RAG Endpoints ====================

const queryRAG = asyncHandler(async (req, res) => {
  const { query, history, category, topK } = req.body;

  if (!query || typeof query !== "string" || !query.trim()) {
    return apiResponse.error(res, "Query string is required for RAG.", 400);
  }

  const result = await ragService.generateRAGResponse(query, history || [], {
    category,
    topK: topK ? Number(topK) : 4,
  });

  return apiResponse.success(res, "RAG response generated successfully", result);
});

const ingestDocument = asyncHandler(async (req, res) => {
  const { title, rawContent, category, source, author, tags, metadata } = req.body;

  if (!title || !rawContent) {
    return apiResponse.error(res, "Title and rawContent are required for ingestion.", 400);
  }

  const result = await ragService.ingestDocument({
    title,
    rawContent,
    category,
    source,
    author,
    tags,
    metadata,
    createdBy: req.user?._id,
  });

  return apiResponse.success(res, "Document ingested and chunked successfully", result, 201);
});

const listDocuments = asyncHandler(async (req, res) => {
  const { category, search, page, limit } = req.query;

  const data = await ragService.listDocuments({
    category,
    search,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
  });

  return apiResponse.success(res, "Knowledge documents retrieved successfully", data);
});

const getDocumentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doc = await ragService.getDocumentById(id);

  if (!doc) {
    return apiResponse.error(res, "Knowledge document not found", 404);
  }

  return apiResponse.success(res, "Knowledge document retrieved successfully", doc);
});

const deleteDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = await ragService.deleteDocument(id);

  if (!deleted) {
    return apiResponse.error(res, "Knowledge document not found or already deleted", 404);
  }

  return apiResponse.success(res, "Knowledge document deleted successfully", { id });
});

module.exports = {
  chat,
  getRecommendations,
  queryRAG,
  ingestDocument,
  listDocuments,
  getDocumentById,
  deleteDocument,
};
