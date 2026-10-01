const scoutService = require("../services/scout.service");
const logger = require("../config/logger");

/**
 * Generates an in-depth AI scouting report for a requested player.
 * POST /api/v1/ai/scout/report
 */
exports.generateScoutingReport = async (req, res) => {
  try {
    const { playerQuery, focusAreas, position, team, age } = req.body;

    if (!playerQuery || !playerQuery.trim()) {
      return res.status(400).json({
        success: false,
        message: "playerQuery is required (e.g. 'Jude Bellingham' or 'Pedri').",
      });
    }

    const report = await scoutService.generateScoutingReport(playerQuery.trim(), {
      focusAreas,
      position,
      team,
      age,
    });

    return res.status(200).json(report);
  } catch (error) {
    logger.error(`[ScoutController] generateScoutingReport error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to generate AI scouting report.",
      error: error.message,
    });
  }
};

/**
 * Discovers similar player profiles and tactical lookalikes.
 * POST /api/v1/ai/scout/similar
 */
exports.findSimilarPlayers = async (req, res) => {
  try {
    const { targetPlayer, position, maxAge, maxFee, limit } = req.body;

    if (!targetPlayer || !targetPlayer.trim()) {
      return res.status(400).json({
        success: false,
        message: "targetPlayer is required (e.g. 'Rodri' or 'Bukayo Saka').",
      });
    }

    const result = await scoutService.findSimilarPlayers({
      targetPlayer: targetPlayer.trim(),
      position,
      maxAge: maxAge ? Number(maxAge) : undefined,
      maxFee,
      limit: limit ? Number(limit) : 4,
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error(`[ScoutController] findSimilarPlayers error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to discover similar player profiles.",
      error: error.message,
    });
  }
};

/**
 * Simulates tactical fit & transfer suitability between a player and club.
 * POST /api/v1/ai/scout/tactical-fit
 */
exports.analyzeTacticalFit = async (req, res) => {
  try {
    const { playerName, targetClub, manager, systemRole } = req.body;

    if (!playerName || !targetClub) {
      return res.status(400).json({
        success: false,
        message: "playerName and targetClub are required.",
      });
    }

    const result = await scoutService.analyzeTacticalFit({
      playerName: playerName.trim(),
      targetClub: targetClub.trim(),
      manager,
      systemRole,
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error(`[ScoutController] analyzeTacticalFit error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to analyze tactical fit.",
      error: error.message,
    });
  }
};
