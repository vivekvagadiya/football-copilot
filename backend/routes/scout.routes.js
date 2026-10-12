const express = require("express");
const router = express.Router();
const scoutController = require("../controller/scout.controller");
const authenticate = require("../middleware/auth.middleware");

// Generate Player Scouting Report
router.post("/report", authenticate, scoutController.generateScoutingReport);

// Find Similar / Lookalike Players
router.post("/similar", authenticate, scoutController.findSimilarPlayers);

// Tactical Fit & Transfer Suitability Simulator
router.post("/tactical-fit", authenticate, scoutController.analyzeTacticalFit);

module.exports = router;
