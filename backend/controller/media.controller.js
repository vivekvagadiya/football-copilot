// backend/controller/media.controller.js
const { uploadImage, uploadVideo, uploadFile } = require('../middleware/upload.middleware');
const MessageService = require('../service/message.service');
const { apiResponse } = require('../utils/apiResponse');

/**
 * Generic Media Upload Handler
 * 
 * Concept: DRY (Don't Repeat Yourself)
 * - Delegates to MessageService to ensure unread counts, last message updates, 
 *   and socket events fire correctly for media types.
 */
const handleMediaUpload = async (req, res, messageType) => {
  try {
    const { conversationId, groupId } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return apiResponse.error(res, `No ${messageType} file provided`, 400);
    }

    const metadata = {
      publicId: req.file.public_id,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    };

    let message;
    if (conversationId) {
      message = await MessageService.sendMessage(
        conversationId,
        userId,
        req.file.secure_url, // Maps to 'content'
        messageType,
        req.file.secure_url, // Maps to 'mediaUrl'
        metadata
      );
    } else if (groupId) {
      message = await MessageService.sendGroupMessage(
        groupId,
        userId,
        req.file.secure_url,
        messageType,
        req.file.secure_url,
        metadata
      );
    } else {
      return apiResponse.error(res, "Must provide conversationId or groupId", 400);
    }

    return apiResponse.success(res, `${messageType} sent successfully`, message, 201);
  } catch (error) {
    return apiResponse.error(res, error.message, 500);
  }
};

const uploadVideoMessage = async (req, res) => {
  return handleMediaUpload(req, res, 'video');
};

const uploadImageMessage = async (req, res) => {
  return handleMediaUpload(req, res, 'image');
};

const uploadFileMessage = async (req, res) => {
  return handleMediaUpload(req, res, 'file');
};

module.exports = {
  uploadImageMessage,
  uploadVideoMessage,
  uploadFileMessage
};