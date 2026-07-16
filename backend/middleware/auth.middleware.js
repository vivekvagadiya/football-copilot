// backend/middleware/auth.middleware.js (enhanced)
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const apiResponse = require("../utils/apiResponse");

const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return apiResponse.unauthorized(res, "Access denied. No token provided.");
    }

    // Check if JWT_SECRET is defined
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined in environment variables");
      return apiResponse.error(res, "Server configuration error.", 500);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return apiResponse.unauthorized(res, "Invalid token. User not found.");
    }
    if (decoded.version != user.tokenVersion) {
      return apiResponse.unauthorized(res, "Token has been revoked.");
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);

    if (error.name === "JsonWebTokenError") {
      return apiResponse.unauthorized(res, "Invalid token format.");
    } else if (error.name === "TokenExpiredError") {
      return apiResponse.unauthorized(res, "Token has expired.");
    } else {
      return apiResponse.unauthorized(res, "Authentication failed.");
    }
  }
};

module.exports = authenticate;
