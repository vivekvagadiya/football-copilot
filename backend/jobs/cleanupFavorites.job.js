const cron = require("node-cron");
const Favorite = require("../models/favorite.model");
const redisClient = require("../config/redis");
const logger = require("../config/logger");

/**
 * Cleanup job to purge ended/expired favorited matches from MongoDB and invalidate Redis caches.
 */
const initCleanupJob = () => {
  // Run every 6 hours: at minute 0 past every 6th hour (e.g. 12am, 6am, 12pm, 6pm)
  cron.schedule("0 */6 * * *", async () => {
    logger.info("🧹 [CRON JOB] Running scheduled cleanup for expired match favorites...");

    try {
      // Threshold: 24 hours ago
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Delete favorited matches older than 24 hours
      const result = await Favorite.deleteMany({
        itemType: "MATCH",
        createdAt: { $lt: cutoffTime },
      });

      logger.info(`✅ [CRON JOB] Successfully purged ${result.deletedCount} expired match favorites from MongoDB.`);

      // Clear all user favorites caches in Redis
      if (redisClient.isReady && result.deletedCount > 0) {
        const keys = await redisClient.keys("cache:favorites:*");
        if (keys && keys.length > 0) {
          await redisClient.del(keys);
          logger.info(`⚡ [CRON JOB] Cleared ${keys.length} user favorite Redis cache keys.`);
        }
      }
    } catch (error) {
      logger.error(`❌ [CRON JOB ERROR] Failed to clean up match favorites: ${error.message}`);
    }
  });

  logger.info("⏱️  [CRON JOB INITIALIZED] Match favorites cleanup scheduled (Runs every 6 hours).");
};

module.exports = initCleanupJob;
