// backend/service/auth.service.js
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const { generateTokens } = require("../utils/generateTokens.js");
const bcrypt = require("bcrypt");
const uploadToCloudinary = require("../utils/uploadToCloudinary.js");
const Chat = require("../models/chat.model.js");

const register = async (username, email, password) => {
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const user = await User.create({ username, email, password });
  console.log("user", user);

  return {
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
    },
  };
};

const login = async (email, password) => {
  const user = await User.findOne({ email }).select("+password").lean(false);

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  user.tokenVersion += 1;

  const tokens = generateTokens(user);

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        refreshToken: tokens.refreshToken,
        isOnline: true,
        lastSeen: new Date(),
      },
      $inc: {
        tokenVersion: 1,
      },
    },
  );

  return {
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
    },
    ...tokens,
  };
};

const refreshToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error("Refresh token required");
  }

  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.userId);

  if (!user) {
    throw new Error("Invalid refresh token");
  }

  if (user.refreshToken !== refreshToken) {
    throw new Error("Refresh token mismatch");
  }

  const tokens = generateTokens(user);
  user.refreshToken = tokens.refreshToken;
  await user.save();
  return tokens;
};

const logout = async (userId) => {
  const user = await User.findById(userId);
  if (user) {
    user.isOnline = false;
    user.lastSeen = new Date();
    await user.save();
  }
  return true;
};

const uploadUserAvatar = async (userId, fileBuffer) => {
  if (!fileBuffer) {
    throw new Error("File buffer is required");
  }

  const result = await uploadToCloudinary(fileBuffer, "user-avatars");

  const user = await User.findByIdAndUpdate(
    userId,
    {
      avatar: result,
    },
    { new: true },
  );

  return user;
};

const updateUserProfile = async (userId, profileData) => {
  const { username } = profileData;

  const user = await User.findByIdAndUpdate(
    userId,
    { username },
    { new: true },
  ).select("-password -refreshToken -tokenVersion");
  return user;
};

const myProfile = async (userId) => {
  const user = await User.findById(userId).select(
    "-password -refreshToken -tokenVersion",
  );
  if (!user) {
    throw new Error("User not found");
  }

  const [chatCount, groupChatCount] = await Promise.all([
    Chat.countDocuments({ participants: userId, type: "direct" }),
    Chat.countDocuments({ participants: userId, type: "group" }),
  ]);
  return {
    user: {
      ...user._doc,
      chatCount,
      groupChatCount,
    },
  };
};
module.exports = {
  register,
  login,
  refreshToken,
  logout,
  uploadUserAvatar,
  updateUserProfile,
  myProfile,
};
