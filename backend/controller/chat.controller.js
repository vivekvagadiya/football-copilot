const {
  addMembersToGroupChat,
  assignAdminRole,
  createDirectChat,
  createGroupChat,
  getChatById,
  getUserChats,
  leaveGroupChat,
  removeMembersFromGroupChat,
  revokeAdminRole,
  updateGroupChat,
  searchConversation,
  clearChat,
  deleteConversation,
  getGroupChatInfo,
  getFormattedChatById,
  deleteGroup,
  toggleFavoriteStatus,
  togglePinStatus,
} = require("../services/chat.service");
const apiResponse = require("../utils/apiResponse");

const createDirectChatController = async (req, res) => {
  try {
    const { participantId } = req.body;
    const userId = req.user.id;
    const chat = await createDirectChat(userId, participantId);

    return apiResponse.success(res, "Direct chat created successfully", chat);
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

const getUserChatsController = async (req, res) => {
  try {
    const userId = req.user.id;
    const chats = await getUserChats(userId);

    return apiResponse.success(res, "Chats retrieved successfully", chats);
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

const getChatByIdController = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await getChatById(chatId, userId);
    return apiResponse.success(res, "Chat retrieved successfully", chat);
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

const createGroupChatController = async (req, res) => {
  try {
    const { name, participantIds } = req.body;
    const userId = req.user.id;
    const chat = await createGroupChat(userId, name, participantIds);
    return apiResponse.success(res, "Group chat created successfully", chat);
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

const addMembersToGroupChatController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;
    const { memberIds } = req.body;
    const chat = await addMembersToGroupChat(userId, chatId, memberIds);
    return apiResponse.success(res, "Members added successfully", chat);
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

const removeMembersFromGroupController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;
    const { memberIds } = req.body;
    const chat = await removeMembersFromGroupChat(userId, chatId, memberIds);

    return apiResponse.success(res, "Members removed successfully", chat);
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

const leaveGroupChatController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;
    const chat = await leaveGroupChat(userId, chatId);

    return apiResponse.success(res, "Left group chat successfully", chat);
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

const deleteGroupController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;
    const { chat, participants } = await deleteGroup(userId, chatId);

    return apiResponse.success(res, "Group deleted successfully", chat);
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

const updateGroupChatController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;
    const { name, groupAvatar } = req.body;
    const chat = await updateGroupChat(userId, chatId, { name, groupAvatar });

    return apiResponse.success(res, "Group chat updated successfully", chat);
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

const assignAdminRoleController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;
    const { memberId } = req.body;
    const chat = await assignAdminRole(userId, chatId, memberId);

    return apiResponse.success(res, "Admin role assigned successfully", chat);
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

const revokeAdminRoleController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;
    const { memberId } = req.body;
    const chat = await revokeAdminRole(userId, chatId, memberId);

    return apiResponse.success(res, "Admin role revoked successfully", chat);
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

const searchChatController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { query } = req.query;
    const chats = await searchConversation(userId, query);
    return apiResponse.success(res, "Chats searched successfully", chats);
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

const clearChatController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;
    const chat = await clearChat(userId, chatId);

    return apiResponse.success(res, "Chat cleared successfully", chat);
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

const deleteChatController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;
    const chat = await deleteConversation(userId, chatId);

    return apiResponse.success(res, "Chat deleted successfully", chat);
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

const groupChatInfoController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;
    const chat = await getGroupChatInfo(userId, chatId);
    return apiResponse.success(
      res,
      "Group chat info retrieved successfully",
      chat,
    );
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

const togglePinStatusController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;
    const chat = await togglePinStatus(userId, chatId);
    return apiResponse.success(res, "Chat pinned successfully", chat);
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

const toggleFavoriteStatusController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;
    const chat = await toggleFavoriteStatus(userId, chatId);
    return apiResponse.success(res, "Chat favorited successfully", chat);
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
};

module.exports = {
  addMembersToGroupChatController,
  assignAdminRoleController,
  createDirectChatController,
  createGroupChatController,
  getChatByIdController,
  getUserChatsController,
  leaveGroupChatController,
  removeMembersFromGroupController,
  revokeAdminRoleController,
  updateGroupChatController,
  searchChatController,
  clearChatController,
  deleteChatController,
  groupChatInfoController,
  deleteGroupController,
  togglePinStatusController,
  toggleFavoriteStatusController,
};
