const express = require("express");
const authenticate = require("../middleware/auth.middleware");
const router = express.Router();
const messageController = require("../controller/message.controller");
const upload = require("../controller/multer");
const {
  deleteMessageSchema,
  editMessageSchema,
  getMessageByIdSchema,
  getMessagesSchema,
  markAsReadSchema,
  sendMessageSchema,
  getUnreadCountSchema,
} = require("../validators/message.validator");
const validateSchema = require("../validators/schema.validator");
router.use(authenticate);

// Message routes
router.post("/send", upload.single("file"), validateSchema(sendMessageSchema), messageController.sendMessageController);
router.get("/", validateSchema(getMessagesSchema), messageController.getMessagesController);
router.put("/:messageId/read", validateSchema(markAsReadSchema), messageController.markAsReadController);
router.put("/:messageId", validateSchema(editMessageSchema), messageController.editMessageController);
router.delete("/:messageId", validateSchema(deleteMessageSchema), messageController.deleteMessageController);
router.get("/:messageId", validateSchema(getMessageByIdSchema), messageController.getMessageByIdController);
router.get("/unread/count", validateSchema(getUnreadCountSchema), messageController.getUnreadMessagesCountController);

module.exports = router;
