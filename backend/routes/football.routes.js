const express = require("express");
const router = express.Router();
const footballController = require("../controller/football.controller");
const authenticate = require("../middleware/auth.middleware");

// Require authentication for all football routes
router.use(authenticate);

router.get("/dashboard", footballController.getDashboardDataController);
router.get("/matches/live", footballController.getLiveMatchesController);
router.get("/matches/upcoming", footballController.getUpcomingMatchesController);
router.get("/standings", footballController.getStandingController);
router.get("/scorers", footballController.getPlayerLeaderboardController);

module.exports = router;
