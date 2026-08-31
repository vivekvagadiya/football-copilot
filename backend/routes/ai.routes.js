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

module.exports = router;
