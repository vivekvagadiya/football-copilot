const asyncHandler = require("../utils/asyncHandler");
const apiResponse = require("../utils/apiResponse");
const aiService = require("../services/ai.service");
const ragService = require("../services/rag.service");
const memoryService = require("../services/memory.service");
const recommendationService = require("../services/recommendation.service");
const AiConversation = require("../models/aiConversation.model");

const chat = asyncHandler(async (req, res) => {
  const { prompt, history, useMemory = true } = req.body;
  const userId = req.user?._id;

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return apiResponse.error(res, "Prompt string is required", 400);
  }

  let memoryPromptBlock = "";
  let recalledMemories = [];
  if (useMemory && userId) {
    const memoryResult = await memoryService.recallUserContext(userId, prompt.trim());
    memoryPromptBlock = memoryResult.memoryPromptBlock;
    recalledMemories = memoryResult.recalledMemories;
  }

  const responseText = await aiService.generateChatResponse(prompt, history || [], {
    memoryPromptBlock,
  });

  return apiResponse.success(res, "AI response generated successfully", {
    response: responseText,
    recalledMemories,
  });
});

const getRecommendations = asyncHandler(async (req, res) => {
  const data = await recommendationService.getAIRecommendations(req.user._id);
  return apiResponse.success(res, "AI recommendations fetched successfully", data);
});

// ==================== Sprint 18: RAG Endpoints ====================

const queryRAG = asyncHandler(async (req, res) => {
  const { query, history, category, topK, useMemory = true } = req.body;
  const userId = req.user?._id;

  if (!query || typeof query !== "string" || !query.trim()) {
    return apiResponse.error(res, "Query string is required for RAG.", 400);
  }

  let memoryPromptBlock = "";
  let recalledMemories = [];
  if (useMemory && userId) {
    const memoryResult = await memoryService.recallUserContext(userId, query.trim(), { category });
    memoryPromptBlock = memoryResult.memoryPromptBlock;
    recalledMemories = memoryResult.recalledMemories;
  }

  const result = await ragService.generateRAGResponse(query, history || [], {
    category,
    topK: topK ? Number(topK) : 4,
    memoryPromptBlock,
  });

  return apiResponse.success(res, "RAG response generated successfully", {
    ...result,
    recalledMemories,
  });
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
        summary: 1,
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
  const { title, category = "all" } = req.body;

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
  const { prompt, isRag = true, category, useMemory = true } = req.body;

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

  // Recall user semantic facts and episodic context
  let memoryPromptBlock = "";
  let recalledMemories = [];
  if (useMemory) {
    const memoryResult = await memoryService.recallUserContext(userId, prompt.trim(), {
      category: category || conversation.category,
    });
    memoryPromptBlock = memoryResult.memoryPromptBlock;
    recalledMemories = memoryResult.recalledMemories;
  }

  // Build history context for AI (sliding window of last 10 messages)
  const historyContext = conversation.messages
    .filter((m) => !m.text.startsWith("**System Error:"))
    .slice(-10)
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
      { category: category || conversation.category, memoryPromptBlock }
    );
    aiAnswer = ragResult.answer;
    sources = ragResult.sources || [];
    chunks = ragResult.chunks || [];
  } else {
    aiAnswer = await aiService.generateChatResponse(prompt, historyContext, {
      memoryPromptBlock,
    });
  }

  // Append AI message
  const aiMsgObj = {
    sender: "ai",
    text: aiAnswer,
    isRag: !!isRag,
    sources,
    chunks,
    recalledMemories,
  };
  conversation.messages.push(aiMsgObj);

  await conversation.save();

  // Async background processing: Extract facts & summarize thread
  setImmediate(() => {
    memoryService
      .extractFactsFromTurns(userId, conversation._id, conversation.messages)
      .catch((err) => console.warn("[MemoryAsync] Fact extraction warning:", err.message));

    if (conversation.messages.length >= 8) {
      memoryService
        .summarizeAndArchiveConversation(userId, conversation._id)
        .catch((err) => console.warn("[MemoryAsync] Summarization warning:", err.message));
    }
  });

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

const getQdrantStatus = asyncHandler(async (req, res) => {
  const qdrantService = require("../services/qdrant.service");
  const stats = await qdrantService.getCollectionStats();
  return apiResponse.success(res, "Qdrant vector database status fetched successfully", stats);
});

// ==================== Sprint 19: AI Memory Management Endpoints ====================

const getUserMemories = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { category } = req.query;

  const memories = await memoryService.getUserMemories(userId, { category });
  return apiResponse.success(res, "User memories fetched successfully", memories);
});

const createUserMemory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { fact, category, confidence } = req.body;

  if (!fact || !fact.trim()) {
    return apiResponse.error(res, "Fact text is required", 400);
  }

  const memory = await memoryService.createUserMemory(userId, {
    fact,
    category,
    confidence,
  });

  return apiResponse.success(res, "User memory created successfully", memory, 201);
});

const updateUserMemory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { fact, category, isActive } = req.body;

  const updated = await memoryService.updateUserMemory(userId, id, {
    fact,
    category,
    isActive,
  });

  if (!updated) {
    return apiResponse.error(res, "Memory item not found", 404);
  }

  return apiResponse.success(res, "User memory updated successfully", updated);
});

const deleteUserMemory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const deleted = await memoryService.deleteMemory(userId, id);
  if (!deleted) {
    return apiResponse.error(res, "Memory item not found or already deleted", 404);
  }

  return apiResponse.success(res, "User memory deleted successfully", { id });
});

const clearAllUserMemories = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const count = await memoryService.clearAllMemories(userId);
  return apiResponse.success(res, "All user memories cleared successfully", {
    deletedCount: count,
  });
});

module.exports = {
  chat,
  getRecommendations,
  queryRAG,
  ingestDocument,
  listDocuments,
  getDocumentById,
  deleteDocument,
  getQdrantStatus,
  listConversations,
  getConversationById,
  createConversation,
  sendMessageToConversation,
  updateConversation,
  deleteConversation,
  clearAllConversations,
  getUserMemories,
  createUserMemory,
  updateUserMemory,
  deleteUserMemory,
  clearAllUserMemories,
};



