// backend/utils/generateTokens.js

const jwt = require("jsonwebtoken");

const generateTokens = (user) => {
  if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error("JWT_SECRET or JWT_REFRESH_SECRET is not configured in environment variables.");
  }

  const accessToken = jwt.sign(
    { userId: user._id, version: user.tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { userId: user._id, version: user.tokenVersion },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return {
    accessToken,
    refreshToken,
  };
};

module.exports = {
  generateTokens,
};
