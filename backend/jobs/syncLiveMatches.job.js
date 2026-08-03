const cron = require("node-cron");
const MatchSummary = require("../models/matchSummary.model");
const footballService = require("../services/football.service");
const logger = require("../config/logger");

/**
 * Scheduled job to sync currently LIVE matches and cache finalized AI summaries when matches end.
 */
const initSyncLiveMatchesJob = () => {
  // Run every 60 minutes
  cron.schedule("0 * * * *", async () => {
    logger.info("📡 [CRON JOB] Running active live and scheduled matches sync...");

    try {
      // Find all cached summaries where the match status is LIVE or SCHEDULED
      const matchesToSync = await MatchSummary.find({ status: { $in: ["LIVE", "SCHEDULED"] } });

      if (matchesToSync.length === 0) {
        logger.info("📡 [CRON JOB] No active live or scheduled matches to sync in database.");
        return;
      }

      logger.info(`📡 [CRON JOB] Syncing ${matchesToSync.length} active live/scheduled matches...`);

      for (const summary of matchesToSync) {
        try {
          // getMatchSummary internally fetches latest data from API and handles:
          // 1. Updating live/scheduled status
          // 2. Generating/updating summary
          // 3. Setting status to FINISHED when completed, caching the final narrative
          await footballService.getMatchSummary(summary.matchId);
          logger.info(`📡 [CRON JOB] Updated cache for match ID: ${summary.matchId}`);
        } catch (err) {
          logger.error(`❌ [CRON JOB ERROR] Failed to sync match ${summary.matchId}: ${err.message}`);
        }
      }
    } catch (error) {
      logger.error(`❌ [CRON JOB ERROR] Live/scheduled match sync cron job failed: ${error.message}`);
    }
  });

  logger.info("⏱️  [CRON JOB INITIALIZED] Active live and scheduled matches sync scheduled (Runs every 60 minutes).");
};

module.exports = initSyncLiveMatchesJob;
