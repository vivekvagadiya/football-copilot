const express = require("express");
const router = express.Router();
const aiController = require("../controller/ai.controller");
const authenticate = require("../middleware/auth.middleware");
const cacheMiddleware = require("../middleware/cache.middleware");

// Require authentication for AI chat
router.post("/chat", authenticate, aiController.chat);

// Require authentication and cache recommendations for 10 minutes
router.get("/recommendations", authenticate, cacheMiddleware(600), aiController.getRecommendations);

module.exports = router;

