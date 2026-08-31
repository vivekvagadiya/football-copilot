const asyncHandler = require("../utils/asyncHandler");
const apiResponse = require("../utils/apiResponse");
const aiService = require("../services/ai.service");
const ragService = require("../services/rag.service");
const recommendationService = require("../services/recommendation.service");
const AiConversation = require("../models/aiConversation.model");

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

// ==================== Sprint 18: AI Conversation & Chat Persistence ====================

const listConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const conversations = await AiConversation.aggregate([
    { $match: { userId } },
    {
      $project: {
        _id: 1,
        title: 1,
        category: 1,
        isPinned: 1,
        createdAt: 1,
        updatedAt: 1,
        messageCount: { $size: "$messages" },
        lastMessage: { $arrayElemAt: ["$messages", -1] },
      },
    },
    { $sort: { isPinned: -1, updatedAt: -1 } },
  ]);

  return apiResponse.success(
    res,
    "AI conversations retrieved successfully",
    conversations
  );
});

const getConversationById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const conversation = await AiConversation.findOne({ _id: id, userId });

  if (!conversation) {
    return apiResponse.error(res, "Conversation not found", 404);
  }

  return apiResponse.success(
    res,
    "Conversation retrieved successfully",
    conversation
  );
});

const createConversation = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { title, category = "all", initialPrompt } = req.body;

  const conversation = new AiConversation({
    userId,
    title: title || "New Session",
    category,
    messages: [
      {
        sender: "ai",
        text: "Tactical Intelligence synchronized. Ask me about **inverted fullbacks**, **half-space overloads**, **VAR clear & obvious error principles**, or **Premier League PSR thresholds**.",
        isRag: true,
      },
    ],
  });

  const saved = await conversation.save();

  return apiResponse.success(
    res,
    "AI conversation created successfully",
    saved,
    201
  );
});

const sendMessageToConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const { prompt, isRag = true, category } = req.body;

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return apiResponse.error(res, "Prompt string is required", 400);
  }

  const conversation = await AiConversation.findOne({ _id: id, userId });
  if (!conversation) {
    return apiResponse.error(res, "Conversation not found", 404);
  }

  // Auto-generate title if currently default and first user message
  const hasUserMessage = conversation.messages.some((m) => m.sender === "user");
  if (!hasUserMessage && (conversation.title === "New Session" || !conversation.title)) {
    const trimmedTitle = prompt.trim().length > 30 
      ? prompt.trim().substring(0, 30) + "..." 
      : prompt.trim();
    conversation.title = trimmedTitle;
  }

  // Build history context for AI
  const historyContext = conversation.messages
    .filter((m) => !m.text.startsWith("**System Error:"))
    .map((m) => ({ sender: m.sender, text: m.text }));

  // Append user message
  const userMsgObj = {
    sender: "user",
    text: prompt.trim(),
  };
  conversation.messages.push(userMsgObj);

  let aiAnswer = "";
  let sources = [];
  let chunks = [];

  if (isRag) {
    const ragResult = await ragService.generateRAGResponse(
      prompt,
      historyContext,
      { category: category || conversation.category }
    );
    aiAnswer = ragResult.answer;
    sources = ragResult.sources || [];
    chunks = ragResult.chunks || [];
  } else {
    aiAnswer = await aiService.generateChatResponse(prompt, historyContext);
  }

  // Append AI message
  const aiMsgObj = {
    sender: "ai",
    text: aiAnswer,
    isRag: !!isRag,
    sources,
    chunks,
  };
  conversation.messages.push(aiMsgObj);

  await conversation.save();

  const savedUserMsg = conversation.messages[conversation.messages.length - 2];
  const savedAiMsg = conversation.messages[conversation.messages.length - 1];

  return apiResponse.success(res, "Message sent successfully", {
    conversationId: conversation._id,
    title: conversation.title,
    userMessage: savedUserMsg,
    aiMessage: savedAiMsg,
  });
});

const updateConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const { title, isPinned, category } = req.body;

  const updateFields = {};
  if (title !== undefined) updateFields.title = title.trim();
  if (isPinned !== undefined) updateFields.isPinned = Boolean(isPinned);
  if (category !== undefined) updateFields.category = category;

  const updated = await AiConversation.findOneAndUpdate(
    { _id: id, userId },
    { $set: updateFields },
    { new: true }
  );

  if (!updated) {
    return apiResponse.error(res, "Conversation not found", 404);
  }

  return apiResponse.success(
    res,
    "Conversation updated successfully",
    updated
  );
});

const deleteConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const deleted = await AiConversation.findOneAndDelete({ _id: id, userId });
  if (!deleted) {
    return apiResponse.error(res, "Conversation not found", 404);
  }

  return apiResponse.success(res, "Conversation deleted successfully", { id });
});

const clearAllConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const result = await AiConversation.deleteMany({ userId });

  return apiResponse.success(
    res,
    "All conversations cleared successfully",
    { deletedCount: result.deletedCount }
  );
});

module.exports = {
  chat,
  getRecommendations,
  queryRAG,
  ingestDocument,
  listDocuments,
  getDocumentById,
  deleteDocument,
  listConversations,
  getConversationById,
  createConversation,
  sendMessageToConversation,
  updateConversation,
  deleteConversation,
  clearAllConversations,
};

