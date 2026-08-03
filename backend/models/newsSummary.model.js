const mongoose = require("mongoose");

const newsSummarySchema = new mongoose.Schema(
  {
    newsId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    aiSummary: {
      type: String,
      default: null,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Automatically delete summaries older than 7 days (604800 seconds)
newsSummarySchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model("NewsSummary", newsSummarySchema);
