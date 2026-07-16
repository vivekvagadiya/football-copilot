// backend/controller/auth.controller.js
const User = require("../models/user.model");
const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/auth.service");
const apiResponse = require("../utils/apiResponse");

// Register
const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const result = await authService.register(username, email, password);

  return apiResponse.success(res, "User registered successfully", result);
});

// Login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.login(email, password);

  return apiResponse.success(res, "Login successful", result);
});

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  const tokens = await authService.refreshToken(refreshToken);
  return apiResponse.success(res, "Token refreshed", tokens);
});

const logout = asyncHandler(async (req, res) => {
  // The user ID comes from the authenticate middleware
  await authService.logout(req.user._id);

  return apiResponse.success(res, "Logout successful");
});

const getMe = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const result = await authService.myProfile(userId);
  return apiResponse.success(res, "User profile fetched", result);
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const { username } = req.body;
  const userId = req.user.id;
  const user = await authService.updateUserProfile(userId, { username });
  return apiResponse.success(res, "User profile updated", { user });
});

const uploadUserAvatar = asyncHandler(async (req, res) => {
  const file = req.file;
  const userId = req.user.id;
  const user = await authService.uploadUserAvatar(userId, file.buffer);
  return apiResponse.success(res, "User avatar uploaded", { user });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updateUserProfile,
  uploadUserAvatar,
};
