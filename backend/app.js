const express = require("express");
const cors = require("cors");
const app = express();
const helmet = require("helmet");
const logger = require("./config/logger");
const errorHandler = require("./middleware/error.middleware");

app.use(helmet());

const authRoutes = require("./routes/auth.routes");
const footballRoutes = require("./routes/football.routes");
const favoriteRoutes = require("./routes/favorite.routes");
const aiRoutes = require("./routes/ai.routes");
const notificationRoutes = require("./routes/notification.routes");
const plannerRoutes = require("./routes/planner.routes");
const multiAgentRoutes = require("./routes/multiAgent.routes");
const scoutRoutes = require("./routes/scout.routes");
const {
  globalLimiter,
  authLimiter,
  aiLimiter,
  footballApiLimiter,
} = require("./middleware/rateLimiter.middleware");

const getAllowedOrigins = () => {
  const allowed = new Set();

  if (process.env.CLIENT_URL) {
    process.env.CLIENT_URL.split(",")
      .map((u) => u.trim())
      .filter(Boolean)
      .forEach((u) => allowed.add(u));
  }

  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(",")
      .map((u) => u.trim())
      .filter(Boolean)
      .forEach((u) => allowed.add(u));
  }

  // Allow standard local dev ports in non-production environments
  if (process.env.NODE_ENV !== "production") {
    [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5173",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ].forEach((u) => allowed.add(u));
  }

  return Array.from(allowed);
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server health checks)
      if (!origin) {
        return callback(null, true);
      }

      const allowedOrigins = getAllowedOrigins();

      if (allowedOrigins.length === 0 && process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Check optional preview regex if configured (e.g. Vercel preview domains)
      if (process.env.ALLOWED_ORIGIN_REGEX) {
        try {
          const regex = new RegExp(process.env.ALLOWED_ORIGIN_REGEX);
          if (regex.test(origin)) {
            return callback(null, true);
          }
        } catch (e) {
          logger.warn(`Invalid ALLOWED_ORIGIN_REGEX: ${e.message}`);
        }
      }

      const corsError = new Error(`CORS error: Origin '${origin}' is not authorized.`);
      corsError.statusCode = 403;
      return callback(corsError);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 86400,
  }),
);
// Request body size limits (defends against large payload memory exhaustion)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  next();
});

// Global API Rate Limiter
app.use("/api/v1", globalLimiter);

// Route endpoints with dedicated rate limiters
app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/football", footballApiLimiter, footballRoutes);
app.use("/api/v1/favorites", favoriteRoutes);
app.use("/api/v1/ai", aiLimiter, aiRoutes);
app.use("/api/v1/ai/scout", aiLimiter, scoutRoutes);
app.use("/api/v1/planner", aiLimiter, plannerRoutes);
app.use("/api/v1/agents", aiLimiter, multiAgentRoutes);
app.use("/api/v1/notifications", notificationRoutes);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found",
  });
});
app.use(errorHandler);

module.exports = app;
