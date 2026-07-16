const messageService = require("../services/message.service");
const apiResponse = require("../utils/apiResponse");
const uploadToCloudinary = require("./upload.cloudinary");

const sendMessageController = async (req, res) => {
  try {
    const userId = req.user.id;
    let { chatId, content, type, mediaUrl } = req.body;

    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "chat_attachments",
      );
      mediaUrl = result.secure_url;
      console.log("result", result);

      if (req.file.mimetype.startsWith("image/")) {
        type = "image";
      } else if (req.file.mimetype.startsWith("video/")) {
        type = "video";
      } else if (req.file.mimetype.startsWith("audio/")) {
        type = "audio";
      } else {
        type = "file";
      }
    }

    if (type !== "text" && !mediaUrl) {
      return apiResponse.error(
        res,
        "Media URL or file is required for non-text messages",
        400,
      );
    }
    const message = await messageService.sendMessage(chatId, userId, {
      content,
      type,
      mediaUrl,
    });

    return apiResponse.success(res, "Message sent successfully", message);
  } catch (error) {
    return apiResponse.error(res, error.message, 400);
  }
};

const getMessagesController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId, before, limit } = req.query;
    const messages = await messageService.getMessages(
      chatId,
      userId,
      before,
      limit,
    );
    return apiResponse.success(res, "Messages fetched successfully", messages);
  } catch (error) {
    return apiResponse.error(res, error.message, 400);
  }
};

const markAsReadController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;
    console.log("messageId", messageId);
    const message = await messageService.markAsRead(messageId, userId);
    return apiResponse.success(
      res,
      "Message marked as read successfully",
      message,
    );
  } catch (error) {
    return apiResponse.error(res, error.message, 400);
  }
};

const editMessageController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;
    const { content } = req.body;
    const message = await messageService.editMessage(
      messageId,
      userId,
      content,
    );
    return apiResponse.success(res, "Message edited successfully", message);
  } catch (error) {
    return apiResponse.error(res, error.message, 400);
  }
};

const deleteMessageController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;
    const message = await messageService.deleteMessage(messageId, userId);
    return apiResponse.success(res, "Message deleted successfully", message);
  } catch (error) {
    return apiResponse.error(res, error.message, 400);
  }
};
const getMessageByIdController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;
    const message = await messageService.getMessageById(messageId, userId);
    return apiResponse.success(res, "Message fetched successfully", message);
  } catch (error) {
    return apiResponse.error(res, error.message, 400);
  }
};

const getUnreadMessagesCountController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.query; // Get chatId from query params
    const result = await messageService.getUnreadCount(chatId, userId);
    return apiResponse.success(
      res,
      "Unread messages count fetched successfully",
      result,
    );
  } catch (error) {
    return apiResponse.error(res, error.message, 400);
  }
};

module.exports = {
  sendMessageController,
  getMessagesController,
  markAsReadController,
  editMessageController,
  deleteMessageController,
  getMessageByIdController,
  getUnreadMessagesCountController,
};
