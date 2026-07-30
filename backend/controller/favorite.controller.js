const favoriteService = require("../services/favorite.service");
const apiResponse = require("../utils/apiResponse");

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

    const result = await favoriteService.toggleFavoriteService(userId, { itemType, externalId, meta });

    return apiResponse.success(
      res,
      result.isFavorite ? "Added to favorites" : "Removed from favorites",
      result
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
    const favorites = await favoriteService.getUserFavoritesService(userId);

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
    const favoriteIds = await favoriteService.getFavoriteIdsService(userId);

    return apiResponse.success(res, "Favorite IDs retrieved successfully", favoriteIds);
  } catch (error) {
    next(error);
  }
};
