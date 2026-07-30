const Favorite = require("../models/favorite.model");
const redisClient = require("../config/redis");
const apiResponse = require("../utils/apiResponse");
const logger = require("../config/logger");

const FAVORITE_CACHE_TTL = 600; // 10 minutes

/**
 * Toggle favorite item (Add if not present, Remove if present)
 */
exports.toggleFavoriteController = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { itemType, externalId, meta } = req.body;

    if (!itemType || !externalId || !meta || !meta.name) {
      return apiResponse.badRequest(res, "itemType, externalId, and meta.name are required.");
    }

    const existing = await Favorite.findOne({ user: userId, itemType, externalId: String(externalId) });

    let isFavorite = false;
    let favoriteData = null;

    if (existing) {
      // Remove from favorites
      await Favorite.findByIdAndDelete(existing._id);
      isFavorite = false;
    } else {
      // Add to favorites
      favoriteData = await Favorite.create({
        user: userId,
        itemType,
        externalId: String(externalId),
        meta: {
          name: meta.name,
          badgeUrl: meta.badgeUrl || "",
          subtitle: meta.subtitle || "",
        },
      });
      isFavorite = true;
    }

    // Invalidate user's Redis favorites cache
    if (redisClient.isReady) {
      const cacheKey = `cache:favorites:${userId}`;
      await redisClient.del(cacheKey).catch((err) => {
        logger.warn(`Failed to clear Redis cache key ${cacheKey}: ${err.message}`);
      });
    }

    return apiResponse.success(
      res,
      isFavorite ? "Added to favorites" : "Removed from favorites",
      { isFavorite, favorite: favoriteData }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all favorites for the logged-in user (with Redis caching)
 */
exports.getUserFavoritesController = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const cacheKey = `cache:favorites:${userId}`;

    // 1. Check Redis Cache first
    if (redisClient.isReady) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        res.setHeader("X-Cache", "HIT");
        return apiResponse.success(res, "User favorites retrieved from cache", JSON.parse(cached));
      }
    }

    // 2. Fetch from MongoDB
    res.setHeader("X-Cache", "MISS");
    const favorites = await Favorite.find({ user: userId }).sort({ createdAt: -1 });

    // 3. Store in Redis Cache
    if (redisClient.isReady) {
      await redisClient.set(cacheKey, JSON.stringify(favorites), { EX: FAVORITE_CACHE_TTL }).catch((err) => {
        logger.warn(`Failed to cache favorites for user ${userId}: ${err.message}`);
      });
    }

    return apiResponse.success(res, "User favorites retrieved successfully", favorites);
  } catch (error) {
    next(error);
  }
};

/**
 * Get list of favorited IDs grouped by itemType for fast frontend UI rendering
 */
exports.getFavoriteIdsController = async (req, res, next) => {
  try {
    const userId = req.user._id;
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

    return apiResponse.success(res, "Favorite IDs retrieved successfully", favoriteIds);
  } catch (error) {
    next(error);
  }
};
