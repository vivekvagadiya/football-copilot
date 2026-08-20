const Notification = require("../models/notification.model");
const favoriteService = require("./favorite.service");
const footballService = require("./football.service");
const aiService = require("./ai.service");
const redisClient = require("../config/redis");
const logger = require("../config/logger");

/**
 * Helper: Invalidate user notification Redis route cache
 */
const clearUserCache = async (userId) => {
  if (redisClient && redisClient.isReady) {
    try {
      const keys = await redisClient.keys(`cache:${userId}:*`);
      if (keys && keys.length > 0) {
        await redisClient.del(keys);
        logger.info(`⚡ Cleared notification Redis route cache for user ${userId}`);
      }
    } catch (err) {
      logger.warn(`Failed to clear Redis cache for user ${userId}: ${err.message}`);
    }
  }
};

/**
 * Service: Fetch all notifications for a specific user.
 * @param {string} userId - User MongoDB ObjectId
 * @returns {Promise<Array>} List of notification documents
 */
const getUserNotifications = async (userId) => {
  try {
    let notifications = await Notification.find({ user: userId }).sort({
      createdAt: -1,
    });

    // Seed default initial AI alerts if user has no notifications yet
    if (notifications.length === 0) {
      notifications = await generateAINotifications(userId);
    }

    return notifications;
  } catch (error) {
    logger.error(`Error fetching notifications for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Service: Mark a single notification as read.
 * @param {string} notificationId - Notification MongoDB ObjectId
 * @param {string} userId - User MongoDB ObjectId
 * @returns {Promise<Object>} Updated notification document
 */
const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { read: true },
      { new: true }
    );
    if (!notification) {
      throw new Error("Notification not found or unauthorized");
    }
    await clearUserCache(userId);
    return notification;
  } catch (error) {
    logger.error(`Error marking notification ${notificationId} as read:`, error);
    throw error;
  }
};

/**
 * Service: Mark all notifications as read for a user.
 * @param {string} userId - User MongoDB ObjectId
 * @returns {Promise<Object>} Status object with updated count
 */
const markAllAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      { user: userId, read: false },
      { read: true }
    );
    await clearUserCache(userId);
    return { success: true, modifiedCount: result.modifiedCount };
  } catch (error) {
    logger.error(`Error marking all notifications as read for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Service: Generate dynamic AI intelligent notifications using Gemini.
 * @param {string} userId - User MongoDB ObjectId
 * @returns {Promise<Array>} List of updated notifications
 */
const generateAINotifications = async (userId) => {
  try {
    // 1. Fetch user favorites
    const rawFavorites = await favoriteService.getUserFavoritesService(userId);
    const favorites = rawFavorites.map((fav) => ({
      itemType: fav.itemType,
      externalId: fav.externalId,
      name: fav.meta?.name || "",
      subtitle: fav.meta?.subtitle || "",
    }));

    // 2. Fetch live & upcoming matches and news
    const liveMatches = await footballService.getLiveMatches();
    const upcomingMatches = await footballService.upcomingMatches(
      undefined,
      undefined,
      undefined,
      10,
      0,
      "SCHEDULED"
    );
    const newsItems = await footballService.getNews(1);

    const matchesList = [
      ...liveMatches.map((m) => ({
        id: m.id,
        homeTeam: m.homeTeam.name,
        awayTeam: m.awayTeam.name,
        leagueName: m.leagueName,
        status: "LIVE",
        score: `${m.homeTeam.score} - ${m.awayTeam.score}`,
        minute: m.minute,
      })),
      ...upcomingMatches.map((m) => ({
        id: m.id,
        homeTeam: m.homeTeam.name,
        awayTeam: m.awayTeam.name,
        leagueName: m.leagueName,
        status: "UPCOMING",
        date: m.date,
      })),
    ];

    const newsList = (newsItems || []).slice(0, 5).map((n) => ({
      id: n.id,
      title: n.title,
      summary: n.summary,
    }));

    // 3. Synthesize alerts via Gemini AI
    let generatedAlerts = [];
    try {
      generatedAlerts = await aiService.generateNotificationsResponse(
        favorites,
        matchesList,
        newsList
      );
    } catch (aiErr) {
      logger.warn(`AI notification generation failed, using fallback alerts: ${aiErr.message}`);
      generatedAlerts = [
        {
          title: "Pre-Match Tactical Briefing",
          message: "Key fixtures scheduled this week. Review scouting reports and tactical probability meters.",
          type: "tactical",
          priority: "high",
        },
        {
          title: "Transfer Intelligence Update",
          message: "Hot transfer deal movements tracked across top European leagues. Check current market value listings.",
          type: "transfer",
          priority: "medium",
        },
      ];
    }

    // 4. Save newly generated notifications in DB
    const docsToInsert = generatedAlerts.map((alert) => ({
      user: userId,
      title: alert.title || "Intelligent Football Alert",
      message: alert.message || "New update available.",
      type: alert.type || "system",
      priority: alert.priority || "medium",
      read: false,
      meta: alert.meta || {},
    }));

    if (docsToInsert.length > 0) {
      await Notification.insertMany(docsToInsert);
    }

    await clearUserCache(userId);

    return await Notification.find({ user: userId }).sort({ createdAt: -1 });
  } catch (error) {
    logger.error(`Error generating AI notifications for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Optimized Batch Service: Single-pass system-wide AI notification generation.
 * Reduces API/AI costs from O(N users) down to O(1) by fetching matches/news once
 * and fanning out synthesized alerts to interested users in a single bulk operation.
 */
const generateBatchSystemNotifications = async () => {
  try {
    const Favorite = require("../models/favorite.model");

    // 1. Fetch live matches, upcoming matches, and news ONCE for the entire system
    const liveMatches = await footballService.getLiveMatches();
    const upcomingMatches = await footballService.upcomingMatches(
      undefined,
      undefined,
      undefined,
      10,
      0,
      "SCHEDULED"
    );
    const newsItems = await footballService.getNews(1);

    const matchesList = [
      ...liveMatches.map((m) => ({
        id: m.id,
        homeTeam: m.homeTeam.name,
        awayTeam: m.awayTeam.name,
        leagueName: m.leagueName,
        status: "LIVE",
        score: `${m.homeTeam.score} - ${m.awayTeam.score}`,
        minute: m.minute,
      })),
      ...upcomingMatches.map((m) => ({
        id: m.id,
        homeTeam: m.homeTeam.name,
        awayTeam: m.awayTeam.name,
        leagueName: m.leagueName,
        status: "UPCOMING",
        date: m.date,
      })),
    ];

    const newsList = (newsItems || []).slice(0, 5).map((n) => ({
      id: n.id,
      title: n.title,
      summary: n.summary,
    }));

    // 2. Fetch all user favorites to identify active favorite teams/players
    const allFavorites = await Favorite.find().select("user itemType externalId meta");
    if (allFavorites.length === 0) {
      logger.info("🔔 [BATCH NOTIFICATIONS] No user favorites found in system. Skipping batch run.");
      return { processedUsers: 0, notificationsCreated: 0 };
    }

    // Group user IDs by favorite team/league/player
    const userFavoritesMap = {};
    allFavorites.forEach((fav) => {
      const uId = String(fav.user);
      if (!userFavoritesMap[uId]) {
        userFavoritesMap[uId] = [];
      }
      userFavoritesMap[uId].push({
        itemType: fav.itemType,
        externalId: fav.externalId,
        name: fav.meta?.name || "",
      });
    });

    const userIds = Object.keys(userFavoritesMap);

    // 3. Synthesize system-wide AI alerts in a single AI call (O(1) AI cost)
    let generatedAlerts = [];
    try {
      // Sample representative favorites context for Gemini
      const sampleFavorites = Object.values(userFavoritesMap).flat().slice(0, 15);
      generatedAlerts = await aiService.generateNotificationsResponse(
        sampleFavorites,
        matchesList,
        newsList
      );
    } catch (aiErr) {
      logger.warn(`Batch AI notification generation failed, using fallback: ${aiErr.message}`);
      generatedAlerts = [
        {
          title: "Matchday Tactical Preview",
          message: "Hot fixture lineups and tactical meters available on your Copilot dashboard today.",
          type: "tactical",
          priority: "medium",
        },
      ];
    }

    // 4. Bulk fan-out insertion across interested users (O(1) DB write)
    const docsToInsert = [];
    userIds.forEach((uId) => {
      generatedAlerts.forEach((alert) => {
        docsToInsert.push({
          user: uId,
          title: alert.title || "Intelligent Football Alert",
          message: alert.message || "New update available.",
          type: alert.type || "system",
          priority: alert.priority || "medium",
          read: false,
          meta: alert.meta || {},
        });
      });
    });

    if (docsToInsert.length > 0) {
      await Notification.insertMany(docsToInsert);
    }

    // 5. Flushes Redis route cache for all processed users
    if (redisClient && redisClient.isReady) {
      for (const uId of userIds) {
        clearUserCache(uId);
      }
    }

    logger.info(
      `🔔 [BATCH NOTIFICATIONS SUCCESS] Generated ${docsToInsert.length} alerts for ${userIds.length} users with 1 system-wide AI pass!`
    );

    return { processedUsers: userIds.length, notificationsCreated: docsToInsert.length };
  } catch (error) {
    logger.error("Error running batch system notifications:", error);
    throw error;
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  generateAINotifications,
  generateBatchSystemNotifications,
};
