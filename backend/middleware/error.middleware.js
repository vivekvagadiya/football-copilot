const logger = require("../config/logger");

/**
 * Extracts a concise, human-readable error string from raw error messages or stringified JSON errors.
 */
function sanitizeErrorMessage(rawMessage) {
  if (!rawMessage || typeof rawMessage !== "string") {
    return "An unexpected server error occurred.";
  }

  // 1. Detect and parse stringified JSON (e.g. from Google GenAI ApiError)
  const jsonStart = rawMessage.indexOf("{");
  if (jsonStart !== -1) {
    try {
      const jsonStr = rawMessage.slice(jsonStart);
      const parsed = JSON.parse(jsonStr);

      if (parsed.error) {
        const errObj = parsed.error;
        if (errObj.code === 429 || errObj.status === "RESOURCE_EXHAUSTED") {
          const retryMatch = (errObj.message || "").match(/Please retry in ([\d\.]+\w*)/i);
          const retryStr = retryMatch ? ` Please retry in ${retryMatch[1]}.` : "";
          return `AI rate limit or quota exceeded.${retryStr}`;
        }

        if (errObj.message) {
          // Strip URLs, quota IDs, and raw stack details
          return errObj.message
            .replace(/For more information on this error.*$/gi, "")
            .replace(/\* Quota exceeded.*$/gi, "")
            .trim()
            .slice(0, 140);
        }
      }
    } catch (e) {
      // If parsing fails, fall back to string regex
    }
  }

  // 2. Check common error keywords
  if (rawMessage.includes("429") || rawMessage.includes("RESOURCE_EXHAUSTED") || rawMessage.includes("quota")) {
    const retryMatch = rawMessage.match(/Please retry in ([\d\.]+\w*)/i);
    const retryStr = retryMatch ? ` Please retry in ${retryMatch[1]}.` : "";
    return `AI quota limit exceeded.${retryStr}`;
  }

  // 3. Clean up other generic prefixes
  return rawMessage
    .replace(/^ApiError:\s*/i, "")
    .replace(/^Error:\s*/i, "")
    .trim()
    .slice(0, 160);
}

const errorHandler = (err, req, res, next) => {
  logger.error(err.stack, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  let statusCode = err.statusCode || err.status || 500;
  let rawMessage = err.message || "Internal Server Error";

  if (err.name === "TokenExpiredError" || rawMessage === "jwt expired") {
    statusCode = 401;
    rawMessage = "Your session has expired.";
  } else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    rawMessage = "Invalid authentication token. Please log in again.";
  } else if (rawMessage.includes("429") || rawMessage.includes("RESOURCE_EXHAUSTED")) {
    statusCode = 429;
  }

  const cleanMessage = sanitizeErrorMessage(rawMessage);

  res.status(statusCode).json({
    success: false,
    message: cleanMessage,
    errors: err.errors || [],
  });
};

module.exports = errorHandler;

