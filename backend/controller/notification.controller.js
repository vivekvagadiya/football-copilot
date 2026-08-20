const notificationService = require("../services/notification.service");
const apiResponse = require("../utils/apiResponse");

/**
 * Controller: Get all notifications for logged in user
 */
const getUserNotificationsController = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const notifications = await notificationService.getUserNotifications(userId);
    return apiResponse.success(
      res,
      "Notifications retrieved successfully",
      notifications
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Mark single notification as read
 */
const markNotificationReadController = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const notification = await notificationService.markAsRead(id, userId);
    return apiResponse.success(
      res,
      "Notification marked as read",
      notification
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Mark all notifications as read
 */
const markAllNotificationsReadController = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const result = await notificationService.markAllAsRead(userId);
    return apiResponse.success(
      res,
      "All notifications marked as read",
      result
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Trigger dynamic AI intelligent notifications generation
 */
const generateAINotificationsController = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const notifications = await notificationService.generateAINotifications(userId);
    return apiResponse.success(
      res,
      "AI Intelligent Notifications generated successfully",
      notifications
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserNotificationsController,
  markNotificationReadController,
  markAllNotificationsReadController,
  generateAINotificationsController,
};
