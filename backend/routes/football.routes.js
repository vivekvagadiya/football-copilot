const express = require("express");
const router = express.Router();
const footballController = require("../controller/football.controller");
const authenticate = require("../middleware/auth.middleware");
const cacheMiddleware = require("../middleware/cache.middleware");

// Require authentication for all football routes
router.use(authenticate);

router.get("/dashboard", cacheMiddleware(60), footballController.getDashboardDataController);
router.get("/matches/live", cacheMiddleware(30), footballController.getLiveMatchesController);
router.get(
  "/matches/upcoming",
  cacheMiddleware(300),
  footballController.getUpcomingMatchesController,
);
router.get("/standings", cacheMiddleware(300), footballController.getStandingController);
router.get("/scorers", cacheMiddleware(600), footballController.getPlayerLeaderboardController);
router.get("/leagues/:code", cacheMiddleware(600), footballController.getLeagueDetailsController);
router.get("/matches/:id", cacheMiddleware(180), footballController.getMatchDetailsController);
router.get("/matches/:id/ai-summary", footballController.getMatchSummaryController);
router.get("/competitions", cacheMiddleware(900), footballController.getCompetationController);
router.get(
  "/competitions/:leagueId/teams",
  cacheMiddleware(600),
  footballController.getTeamsByCompetationController
);
router.get("/players/:id", cacheMiddleware(900), footballController.getPlayerDetailsController);
router.get("/teams/:id", cacheMiddleware(900), footballController.getTeamDetailsController);
module.exports = router;
