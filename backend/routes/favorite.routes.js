const express = require("express");
const router = express.Router();
const favoriteController = require("../controller/favorite.controller");
const authenticate = require("../middleware/auth.middleware");

// Require authentication for all favorite routes
router.use(authenticate);

router.post("/toggle", favoriteController.toggleFavoriteController);
router.get("/", favoriteController.getUserFavoritesController);
router.get("/ids", favoriteController.getFavoriteIdsController);

module.exports = router;
