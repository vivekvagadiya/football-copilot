const { createClient } = require("redis");
const logger = require("./logger");

// Define Redis URL (uses 'redis' host inside Docker, defaults to localhost)
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const redisClient = createClient({
  url: REDIS_URL,
});

// Event listeners for Redis client
redisClient.on("connect", () => {
  logger.info("Connecting to Redis...");
});

redisClient.on("ready", () => {
  logger.info("⚡ Redis client connected and ready!");
});

redisClient.on("error", (err) => {
  logger.warn(`⚠️ Redis Connection Error: ${err.message}`);
});

// Immediately connect asynchronously
(async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.warn(`⚠️ Initial Redis connection failed: ${error.message}. App will continue without cache.`);
  }
})();

module.exports = redisClient;
