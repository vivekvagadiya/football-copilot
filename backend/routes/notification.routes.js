const express = require("express");
const router = express.Router();
const notificationController = require("../controller/notification.controller");
const authenticate = require("../middleware/auth.middleware");
const cacheMiddleware = require("../middleware/cache.middleware");

// Require authentication for notification endpoints
router.use(authenticate);

router.get("/", cacheMiddleware(300), notificationController.getUserNotificationsController);
router.patch("/:id/read", notificationController.markNotificationReadController);
router.patch("/read-all", notificationController.markAllNotificationsReadController);
router.post("/generate", notificationController.generateAINotificationsController);

module.exports = router;
