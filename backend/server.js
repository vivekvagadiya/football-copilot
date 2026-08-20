require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const initCleanupJob = require("./jobs/cleanupFavorites.job");
const initSyncLiveMatchesJob = require("./jobs/syncLiveMatches.job");
const initGenerateNotificationsJob = require("./jobs/generateNotifications.job");

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  await connectDB();

  // Initialize Cron Jobs
  initCleanupJob();
  initSyncLiveMatchesJob();
  initGenerateNotificationsJob();

  const server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(
      `Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`,
    );
  });
};
startServer();
