const Favorite = require("../models/favorite.model");
const redisClient = require("../config/redis");
const logger = require("../config/logger");

/**
 * Service: Toggle favorite item in MongoDB and clear user's route cache in Redis
 */
const toggleFavoriteService = async (userId, { itemType, externalId, meta }) => {
  const extIdStr = String(externalId);
  const existing = await Favorite.findOne({ user: userId, itemType, externalId: extIdStr });

  let isFavorite = false;
  let favoriteData = null;

  if (existing) {
    await Favorite.findByIdAndDelete(existing._id);
    isFavorite = false;
  } else {
    favoriteData = await Favorite.create({
      user: userId,
      itemType,
      externalId: extIdStr,
      meta: {
        name: meta.name,
        badgeUrl: meta.badgeUrl || "",
        subtitle: meta.subtitle || "",
      },
    });
    isFavorite = true;
  }

  // Invalidate all Redis route cache keys for this user
  if (redisClient.isReady) {
    const keys = await redisClient.keys(`cache:${userId}:*`);
    if (keys && keys.length > 0) {
      await redisClient.del(keys).catch((err) => {
        logger.warn(`Failed to clear Redis route cache for user ${userId}: ${err.message}`);
      });
    }
  }

  return { isFavorite, favorite: favoriteData };
};

/**
 * Service: Retrieve all user favorites from MongoDB
 */
const getUserFavoritesService = async (userId) => {
  return await Favorite.find({ user: userId }).sort({ createdAt: -1 });
};

/**
 * Service: Retrieve favorited IDs grouped by itemType from MongoDB
 */
const getFavoriteIdsService = async (userId) => {
  const favorites = await Favorite.find({ user: userId }).select("itemType externalId");

  const favoriteIds = {
    TEAM: [],
    PLAYER: [],
    MATCH: [],
    LEAGUE: [],
  };

  favorites.forEach((fav) => {
    if (favoriteIds[fav.itemType]) {
      favoriteIds[fav.itemType].push(fav.externalId);
    }
  });

  return favoriteIds;
};

module.exports = {
  toggleFavoriteService,
  getUserFavoritesService,
  getFavoriteIdsService,
};
