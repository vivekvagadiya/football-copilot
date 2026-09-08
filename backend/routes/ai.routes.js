const express = require("express");
const router = express.Router();
const aiController = require("../controller/ai.controller");
const authenticate = require("../middleware/auth.middleware");
const cacheMiddleware = require("../middleware/cache.middleware");

// AI Chat (Sprint 11 - 15)
router.post("/chat", authenticate, aiController.chat);

// AI Recommendations (Sprint 16)
router.get(
  "/recommendations",
  authenticate,
  cacheMiddleware(3600),
  aiController.getRecommendations,
);

// ==================== Sprint 18: RAG Routes ====================
// RAG Query: Context-grounded response generation
router.post("/rag/query", authenticate, aiController.queryRAG);

// RAG Ingestion: Add new documents to the knowledge base
router.post("/rag/ingest", authenticate, aiController.ingestDocument);

// RAG Documents: List all indexed documents
router.get("/rag/documents", authenticate, aiController.listDocuments);

// RAG Document by ID
router.get("/rag/documents/:id", authenticate, aiController.getDocumentById);

// Delete Document
router.delete("/rag/documents/:id", authenticate, aiController.deleteDocument);

// ==================== Sprint 20: Qdrant Vector DB Routes ====================
// Qdrant Vector DB Collection Status & Health Check
router.get("/rag/qdrant-status", authenticate, aiController.getQdrantStatus);


// ==================== Sprint 18: AI Conversation & Chat Persistence ====================
// List all conversations for the user
router.get("/conversations", authenticate, aiController.listConversations);

// Create a new conversation session
router.post("/conversations", authenticate, aiController.createConversation);

// Clear all conversations for the user
router.delete("/conversations", authenticate, aiController.clearAllConversations);

// Get single conversation with full message history
router.get("/conversations/:id", authenticate, aiController.getConversationById);

// Send message to conversation (handles RAG or standard chat, persists turns)
router.post("/conversations/:id/messages", authenticate, aiController.sendMessageToConversation);

// Rename or update conversation (title, isPinned, category)
router.patch("/conversations/:id", authenticate, aiController.updateConversation);

// Delete single conversation
router.delete("/conversations/:id", authenticate, aiController.deleteConversation);

// ==================== Sprint 19: AI Memory Management Routes ====================
// List all user memories & preferences
router.get("/memories", authenticate, aiController.getUserMemories);

// Manually add a user memory / fact
router.post("/memories", authenticate, aiController.createUserMemory);

// Update a memory fact or status
router.patch("/memories/:id", authenticate, aiController.updateUserMemory);

// Delete a specific memory item
router.delete("/memories/:id", authenticate, aiController.deleteUserMemory);

// Clear all memories for the user (GDPR wipe)
router.delete("/memories", authenticate, aiController.clearAllUserMemories);

module.exports = router;

