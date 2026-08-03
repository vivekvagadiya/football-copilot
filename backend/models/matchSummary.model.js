const mongoose = require("mongoose");

const matchSummarySchema = new mongoose.Schema(
  {
    matchId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["SCHEDULED", "LIVE", "FINISHED"],
      default: "SCHEDULED",
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

module.exports = mongoose.model("MatchSummary", matchSummarySchema);
