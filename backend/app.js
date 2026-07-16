const express = require("express");
const cors = require("cors");
const app = express();
const helmet = require("helmet");
const logger = require("./config/logger");
const errorHandler = require("./middleware/error.middleware");

app.use(helmet());

const authRoutes = require("./routes/auth.routes");

const clientUrl = process.env.CLIENT_URL
  ? process.env.CLIENT_URL
  : "http://localhost:3000";

app.use(
  cors({
    origin: [
      clientUrl,
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  }),
);
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  next();
});

app.use("/api/v1/auth", authRoutes);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found",
  });
});
app.use(errorHandler);

module.exports = app;
