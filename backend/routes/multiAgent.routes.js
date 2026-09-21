const express = require("express");
const router = express.Router();
const multiAgentController = require("../controller/multiAgent.controller");
const authenticate = require("../middleware/auth.middleware");

// All multi-agent endpoints require authentication
router.use(authenticate);

// Get available staff members
router.get("/registry", multiAgentController.getAgentsRegistryController);

// Collaborative multi-agent execution
router.post("/collaborate", multiAgentController.collaborateController);

// Direct 1-on-1 specialist chat
router.post("/chat/:agentId", multiAgentController.directChatController);

module.exports = router;
