const mongoose = require("mongoose");
const Chat = require("../models/chat.model");
const Message = require("../models/message.model");
const ChatMember = require("../models/chatMember.model");
const User = require("../models/user.model");

const formatReactions = (reactions) => {
  if (!reactions || !reactions.length) return [];
  const counts = {};
  reactions.forEach((r) => {
    counts[r.emoji] = (counts[r.emoji] || 0) + 1;
  });
  return Object.keys(counts).map((emoji) => ({
    emoji,
    users: counts[emoji],
  }));
};

const getChatOrThrow = async (chatId) => {
  const chat = await Chat.findById(chatId).select(
    "participants type isActive lastMessage",
  );

  if (!chat) {
    throw new Error("Chat not found");
  }

  if (!chat.isActive) {
    throw new Error("Chat is not active");
  }

  return chat;
};

const isParticipant = (chat, userId) => {
  return chat.participants.some((participant) => {
    const participantId = participant._id
      ? participant._id.toString()
      : participant.toString();
    return participantId === userId.toString();
  });
};
const sendMessage = async (
  chatId,
  userId,
  { content, type = "text", mediaUrl = null },
) => {
  // Validate input
  if (!content || content.trim().length === 0) {
    throw new Error("Message content is required");
  }

  if (content.length > 500) {
    throw new Error("Message content cannot exceed 500 characters");
  }

  const chat = await getChatOrThrow(chatId);

  if (!isParticipant(chat, userId)) {
    throw new Error("You are not a participant of this chat");
  }

  // Create message
  const message = await Message.create({
    chatId: chatId, // Use 'chat' instead of 'chatId' to match model
    senderId: userId, // Use 'sender' instead of 'senderId' to match model
    content: content.trim(),
    type: type, // Use 'messageType' instead of 'type'
    mediaUrl: mediaUrl, // Use 'fileUrl' instead of 'mediaUrl'
  });

  // Update chat's last message
  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: message._id,
    updatedAt: new Date(),
  });

  // Update sender's ChatMember lastReadMessage
  await ChatMember.findOneAndUpdate(
    { chatId, userId },
    {
      $set: {
        lastReadMessage: message._id,
        lastReadAt: new Date(),
      },
    },
    { upsert: true },
  );

  // Return populated message
  return await Message.findById(message._id)
    .populate("senderId", "username avatar")
    .select("-__v");
};
const getMessages = async (chatId, userId, before = null, limit = 20) => {
  const chat = await getChatOrThrow(chatId);

  if (!isParticipant(chat, userId)) {
    throw new Error("You are not a participant of this chat");
  }

  // Update ChatMember's lastReadMessage and lastReadAt for the viewing user
  if (chat.lastMessage) {
    await ChatMember.findOneAndUpdate(
      { chatId, userId },
      {
        $set: {
          lastReadMessage: chat.lastMessage,
          lastReadAt: new Date(),
        },
      },
      { upsert: true },
    );
  } else {
    await ChatMember.findOneAndUpdate(
      { chatId, userId },
      {
        $set: {
          lastReadAt: new Date(),
        },
      },
      { upsert: true },
    );
  }

  // Validate and sanitize limit (capped at 100)
  limit = Math.min(100, Math.max(1, Number(limit) || 20));

  const query = {
    chatId: chatId,
    isDeleted: { $ne: true }, // Exclude deleted messages
  };

  if (before) {
    if (mongoose.Types.ObjectId.isValid(before)) {
      query._id = { $lt: new mongoose.Types.ObjectId(before) };
    } else {
      console.warn(
        `Invalid before cursor provided: ${before}. Loading latest messages instead.`,
      );
    }
  }

  // Fetch limit + 1 messages to determine hasMore
  const messages = await Message.find(query)
    .populate("senderId", "username avatar")
    .sort({ _id: -1 }) // Sort newest first
    .limit(limit + 1)
    .select("-__v")
    .lean();

  const hasMore = messages.length > limit;
  const slicedMessages = hasMore ? messages.slice(0, limit) : messages;

  // The cursor for the next page is the ID of the oldest message in our current result batch
  // Since we sorted descending, the last element of the sliced batch is the oldest.
  const nextCursor =
    slicedMessages.length > 0
      ? slicedMessages[slicedMessages.length - 1]._id.toString()
      : null;

  const formattedMessages = slicedMessages.map((m) => ({
    ...m,
    reactions: formatReactions(m.reactions),
  }));

  return {
    messages: formattedMessages.reverse(), // Reverse to return in chronological order (oldest first)
    pagination: {
      hasMore,
      nextCursor: hasMore ? nextCursor : null,
    },
  };
};

const markAsRead = async (messageId, userId) => {
  const message = await Message.findById(messageId);

  if (!message) {
    throw new Error("Message not found");
  }

  if (message.isDeleted) {
    throw new Error("Cannot mark deleted message as read");
  }

  if (message.senderId.toString() === userId) {
    return message; // Sender doesn't need to mark their own message as read
  }

  // Check if user is a participant in the chat
  const chat = await getChatOrThrow(message.chatId);
  if (!isParticipant(chat, userId)) {
    throw new Error("You are not a participant of this chat");
  }

  // Update ChatMember's lastReadMessage if the message is newer than current lastReadMessage
  const member = await ChatMember.findOne({ chatId: message.chatId, userId });
  if (
    !member ||
    !member.lastReadMessage ||
    messageId > member.lastReadMessage.toString()
  ) {
    await ChatMember.findOneAndUpdate(
      { chatId: message.chatId, userId },
      {
        $set: {
          lastReadMessage: message._id,
          lastReadAt: new Date(),
        },
      },
      { upsert: true },
    );
  }

  return message;
};

const markChatAsRead = async (chatId, userId) => {
  const chat = await getChatOrThrow(chatId);

  if (!isParticipant(chat, userId)) {
    throw new Error("You are not a participant of this chat");
  }

  if (chat.lastMessage) {
    await ChatMember.findOneAndUpdate(
      { chatId, userId },
      {
        $set: {
          lastReadMessage: chat.lastMessage,
          lastReadAt: new Date(),
        },
      },
      { upsert: true },
    );
  } else {
    await ChatMember.findOneAndUpdate(
      { chatId, userId },
      {
        $set: {
          lastReadAt: new Date(),
        },
      },
      { upsert: true },
    );
  }

  return {
    markedCount: 1,
    message: "Chat marked as read",
  };
};

const editMessage = async (messageId, userId, content) => {
  // Validate input
  if (!content || content.trim().length === 0) {
    throw new Error("Message content is required");
  }

  const message = await Message.findById(messageId);

  if (!message) {
    throw new Error("Message not found");
  }

  if (message.isDeleted) {
    throw new Error("Cannot edit deleted message");
  }

  if (message.senderId.toString() !== userId.toString()) {
    throw new Error("You are not the sender of this message");
  }

  // Check if user is a participant in the chat
  const chat = await getChatOrThrow(message.chatId);
  if (!isParticipant(chat, userId)) {
    throw new Error("You are not a participant of this chat");
  }

  return await Message.findByIdAndUpdate(
    messageId,
    {
      content: content.trim(),
      isEdited: true,
      editedAt: new Date(),
    },
    { new: true },
  )
    .populate("senderId", "username avatar")
    .select("-__v");
};

const deleteMessage = async (messageId, userId) => {
  const message = await Message.findById(messageId);

  if (!message) {
    throw new Error("Message not found");
  }

  if (message.isDeleted) {
    throw new Error("Message already deleted");
  }

  if (message.senderId.toString() !== userId.toString()) {
    throw new Error("You are not the sender of this message");
  }

  // Check if user is a participant in the chat
  const chat = await getChatOrThrow(message.chatId);
  if (!isParticipant(chat, userId)) {
    throw new Error("You are not a participant of this chat");
  }

  return await Message.findByIdAndUpdate(
    messageId,
    {
      isDeleted: true,
      deletedAt: new Date(),
      content: "This message has been deleted", // Optional: clear content
    },
    { new: true },
  ).select("-__v");
};

// Additional utility functions
const getMessageById = async (messageId, userId) => {
  const message = await Message.findById(messageId)
    .populate("senderId", "username avatar")
    .populate("chatId", "type")
    .populate("chatId", "participants")
    .select("-__v")
    .lean();

  if (!message) {
    throw new Error("Message not found");
  }

  if (message.isDeleted) {
    throw new Error("Message has been deleted");
  }

  // Check if user is a participant in the chat
  if (!isParticipant(message.chatId, userId)) {
    throw new Error("You are not a participant of this chat");
  }

  message.reactions = formatReactions(message.reactions);
  return message;
};

const getUnreadCount = async (chatId, userId) => {
  const chat = await getChatOrThrow(chatId);

  if (!isParticipant(chat, userId)) {
    throw new Error("You are not a participant of this chat");
  }

  const member = await ChatMember.findOne({ chatId, userId });
  const query = {
    chatId: chatId,
    senderId: { $ne: userId },
    isDeleted: { $ne: true },
  };

  if (member && member.lastReadMessage) {
    query._id = { $gt: member.lastReadMessage };
  }

  const count = await Message.countDocuments(query);

  return { unreadCount: count };
};

const addMessageReaction = async (messageId, userId, emoji) => {
  const message = await Message.findById(messageId);
  if (!message) {
    throw new Error("Message not found");
  }

  if (message.isDeleted) {
    throw new Error("Message has been deleted");
  }

  // Find if this user already reacted with this emoji
  const existingIndex = message.reactions.findIndex(
    (r) => r.userId.toString() === userId.toString() && r.emoji === emoji,
  );

  if (existingIndex > -1) {
    // Toggle off: remove reaction
    message.reactions.splice(existingIndex, 1);
  } else {
    // Toggle on: add reaction
    message.reactions.push({ userId, emoji });
  }

  await message.save();
  return formatReactions(message.reactions);
};

module.exports = {
  sendMessage,
  getMessages,
  markAsRead,
  markChatAsRead,
  editMessage,
  deleteMessage,
  getMessageById,
  addMessageReaction,
  getUnreadCount,
};
