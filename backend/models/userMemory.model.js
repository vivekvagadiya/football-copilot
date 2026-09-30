const mongoose = require("mongoose");

const userMemorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        "tactical_preference",
        "team_loyalty",
        "player_interest",
        "scouting_criteria",
        "general",
      ],
      default: "general",
      required: true,
      index: true,
    },
    fact: {
      type: String,
      required: true,
      trim: true,
    },
    confidence: {
      type: Number,
      default: 0.9,
      min: 0,
      max: 1,
    },
    sourceConversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AiConversation",
      default: null,
    },
    qdrantPointId: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

userMemorySchema.index({ userId: 1, category: 1 });
userMemorySchema.index({ userId: 1, isActive: 1, updatedAt: -1 });

const UserMemory = mongoose.model("UserMemory", userMemorySchema);

module.exports = UserMemory;
