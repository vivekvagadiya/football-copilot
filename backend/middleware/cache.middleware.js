const redisClient = require("../config/redis");
const logger = require("../config/logger");

/**
 * Reusable Redis Cache Middleware for Express GET routes.
 * @param {number} ttlInSeconds - Expiration time in seconds (e.g., 300 = 5 mins)
 */
const cacheMiddleware = (ttlInSeconds = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Bypass caching if Redis is not connected
    if (!redisClient.isReady) {
      return next();
    }

    // Construct a unique cache key based on route & query parameters
    const cacheKey = `cache:${req.originalUrl}`;

    try {
      // 1. Check if data exists in Redis cache
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        logger.info(`⚡ Cache HIT: ${cacheKey}`);
        res.setHeader("X-Cache", "HIT");
        return res.json(JSON.parse(cachedData));
      }

      // 2. Cache MISS - Capture the original res.json response to store in Redis
      logger.info(`🌐 Cache MISS: ${cacheKey}`);
      res.setHeader("X-Cache", "MISS");

      const originalJson = res.json.bind(res);

      res.json = (body) => {
        // Restore original res.json behavior
        originalJson(body);

        // Save successful responses to Redis with TTL (Time-To-Live)
        if (res.statusCode >= 200 && res.statusCode < 300 && body) {
          redisClient
            .set(cacheKey, JSON.stringify(body), { EX: ttlInSeconds })
            .catch((err) => {
              logger.warn(`Failed to save key ${cacheKey} to Redis: ${err.message}`);
            });
        }
      };

      next();
    } catch (error) {
      logger.warn(`Redis Middleware Error: ${error.message}`);
      next();
    }
  };
};

module.exports = cacheMiddleware;
