const express = require("express");
const router = express.Router();
const favoriteController = require("../controller/favorite.controller");
const authenticate = require("../middleware/auth.middleware");
const cacheMiddleware = require("../middleware/cache.middleware");

// Require authentication for all favorite routes
router.use(authenticate);

router.post("/toggle", favoriteController.toggleFavoriteController);
router.get("/", cacheMiddleware(600), favoriteController.getUserFavoritesController);
router.get("/ids", cacheMiddleware(600), favoriteController.getFavoriteIdsController);

module.exports = router;
