const mongoose = require("mongoose");

const aiMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ["user", "ai"],
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    isRag: {
      type: Boolean,
      default: false,
    },
    sources: [
      {
        documentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "KnowledgeDocument",
        },
        title: String,
        category: String,
        source: String,
        author: String,
      },
    ],
    chunks: [
      {
        title: String,
        chunkIndex: Number,
        category: String,
        snippet: String,
        score: Number,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const aiConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: "New Session",
    },
    category: {
      type: String,
      enum: ["all", "tactics", "rules", "scouting", "history", "general"],
      default: "all",
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    messages: [aiMessageSchema],
  },
  {
    timestamps: true,
  }
);

// Optimize retrieval of conversations sorted by most recently updated
aiConversationSchema.index({ userId: 1, updatedAt: -1 });

const AiConversation = mongoose.model("AiConversation", aiConversationSchema);

module.exports = AiConversation;
