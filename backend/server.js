require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const initCleanupJob = require("./jobs/cleanupFavorites.job");

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  await connectDB();

  // Initialize Cron Jobs
  initCleanupJob();

  const server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(
      `Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`,
    );
  });
};
startServer();
