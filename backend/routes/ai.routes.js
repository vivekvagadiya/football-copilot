const express = require("express");
const router = express.Router();
const aiController = require("../controller/ai.controller");
const authenticate = require("../middleware/auth.middleware");

// Require authentication for AI chat
router.post("/chat", authenticate, aiController.chat);

module.exports = router;
