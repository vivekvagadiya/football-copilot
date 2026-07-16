const logger = require("../config/logger");

const errorHandler = (err, req, res, next) => {
  logger.error(err.stack, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err.name === "TokenExpiredError" || message === "jwt expired") {
    statusCode = 401;
    message = "Your session has expired.";
  } else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token. Please log in again.";
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || [],
  });
};

module.exports = errorHandler;
