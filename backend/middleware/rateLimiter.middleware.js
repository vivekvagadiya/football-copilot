const redisClient = require("../config/redis");
const logger = require("../config/logger");

/**
 * In-memory fallback store when Redis is unavailable or offline.
 * Map: key -> { count: number, resetAt: number }
 */
const inMemoryStore = new Map();

// Periodic cleanup of expired in-memory keys every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of inMemoryStore.entries()) {
    if (now >= record.resetAt) {
      inMemoryStore.delete(key);
    }
  }
}, 60000).unref(); // unref prevents timer from holding Node event loop open in tests

/**
 * Creates a rate limiting middleware with Redis storage and in-memory fallback.
 *
 * @param {Object} options
 * @param {number} options.windowSeconds - Window duration in seconds
 * @param {number} options.maxRequests - Max requests allowed in the window
 * @param {string} options.keyPrefix - Prefix for cache keys (e.g. "auth", "ai", "football")
 * @param {string} [options.message] - Custom 429 rejection message
 */
function createRateLimiter({
  windowSeconds = 60,
  maxRequests = 30,
  keyPrefix = "api",
  message = "Too many requests. Please slow down.",
}) {
  return async (req, res, next) => {
    // Determine client identifier: Prefer authenticated user ID, fallback to client IP
    const clientId = req.user?._id
      ? `user:${req.user._id}`
      : `ip:${
          req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
          req.ip ||
          req.socket?.remoteAddress ||
          "127.0.0.1"
        }`;

    const cacheKey = `ratelimit:${keyPrefix}:${clientId}`;
    const windowMs = windowSeconds * 1000;

    let currentCount = 0;
    let ttlSeconds = windowSeconds;

    // 1. Try Redis first if connected and ready
    if (redisClient && redisClient.isReady) {
      try {
        const count = await redisClient.incr(cacheKey);
        if (count === 1) {
          await redisClient.expire(cacheKey, windowSeconds);
        }
        const ttl = await redisClient.ttl(cacheKey);
        currentCount = count;
        ttlSeconds = ttl > 0 ? ttl : windowSeconds;
      } catch (redisErr) {
        logger.warn(
          `[RateLimiter] Redis error, falling back to in-memory store: ${redisErr.message}`,
        );
        // Fall back to in-memory tracking below
      }
    }

    // 2. In-memory fallback if Redis was not used or failed
    if (currentCount === 0) {
      const now = Date.now();
      const record = inMemoryStore.get(cacheKey);

      if (!record || now >= record.resetAt) {
        currentCount = 1;
        inMemoryStore.set(cacheKey, { count: 1, resetAt: now + windowMs });
        ttlSeconds = windowSeconds;
      } else {
        record.count += 1;
        currentCount = record.count;
        ttlSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
      }
    }

    // Set standard rate limit headers
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader(
      "X-RateLimit-Remaining",
      Math.max(0, maxRequests - currentCount),
    );
    res.setHeader("X-RateLimit-Reset", ttlSeconds);

    // If threshold exceeded, reject with 429 Too Many Requests
    if (currentCount > maxRequests) {
      res.setHeader("Retry-After", ttlSeconds);
      logger.warn(
        `[RateLimiter] 429 Exceeded: ${cacheKey} (${currentCount}/${maxRequests})`,
      );

      return res.status(429).json({
        success: false,
        message,
        retryAfter: ttlSeconds,
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
}

/**
 * 1. Auth Rate Limiter (Brute Force Protection)
 * Limit: 10 attempts per 15 minutes per IP
 */
const authLimiter = createRateLimiter({
  windowSeconds: 900, // 15 minutes
  maxRequests: 10,
  keyPrefix: "auth",
  message: "Too many authentication attempts. Please try again in 15 minutes.",
});

/**
 * 2. AI Endpoints Limiter (Expensive LLM & RAG Protection)
 * Limit: 20 prompts per minute per user/IP
 */
const aiLimiter = createRateLimiter({
  windowSeconds: 60, // 1 minute
  maxRequests: 20,
  keyPrefix: "ai",
  message:
    "AI rate limit exceeded. Please wait a moment before sending another prompt.",
});

/**
 * 3. Football Data API Limiter (External Quota & Rate Limit Protection)
 * Limit: 60 requests per minute per user/IP
 */
const footballApiLimiter = createRateLimiter({
  windowSeconds: 60, // 1 minute
  maxRequests: 60,
  keyPrefix: "football",
  message:
    "Too many football data requests. Please slow down to preserve live data quotas.",
});

/**
 * 4. General Global Limiter (DDoS & Scraping Protection)
 * Limit: 300 requests per 15 minutes per IP
 */
const globalLimiter = createRateLimiter({
  windowSeconds: 900, // 15 minutes
  maxRequests: 300,
  keyPrefix: "global",
  message: "Too many requests from this IP. Please try again later.",
});

module.exports = {
  createRateLimiter,
  authLimiter,
  aiLimiter,
  footballApiLimiter,
  globalLimiter,
};
