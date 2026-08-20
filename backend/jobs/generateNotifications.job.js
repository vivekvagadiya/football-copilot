const cron = require("node-cron");
const Favorite = require("../models/favorite.model");
const notificationService = require("../services/notification.service");
const logger = require("../config/logger");

/**
 * Scheduled Cron Job to generate Intelligent AI Notifications periodically
 * for users with active favorites.
 */
const initGenerateNotificationsJob = () => {
  // Run every 60 minutes in production (or on schedule)
  cron.schedule("0 * * * *", async () => {
    logger.info(
      "🔔 [CRON JOB] Starting single-pass Intelligent AI Notifications batch job...",
    );

    try {
      const result = await notificationService.generateBatchSystemNotifications();
      logger.info(
        `🔔 [CRON JOB SUCCESS] Processed notifications for ${result.processedUsers} users, creating ${result.notificationsCreated} total alert entries in 1 system pass.`,
      );
    } catch (error) {
      logger.error(
        `❌ [CRON JOB ERROR] Intelligent notifications cron job failed: ${error.message}`,
      );
    }
  });

  logger.info(
    "⏱️  [CRON JOB INITIALIZED] Intelligent AI Notifications scheduler initialized (Runs every 30 minutes).",
  );
};

module.exports = initGenerateNotificationsJob;
