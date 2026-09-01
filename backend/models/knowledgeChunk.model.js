const mongoose = require("mongoose");

const knowledgeChunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KnowledgeDocument",
      required: true,
      index: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["tactics", "rules", "history", "scouting", "news", "general"],
      default: "general",
      index: true,
    },
    source: {
      type: String,
      default: "Manual Ingestion",
      trim: true,
    },
    author: {
      type: String,
      default: "Football Copilot Editorial",
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    tokenEstimate: {
      type: Number,
      default: 0,
    },
    keywords: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    embedding: {
      type: [Number],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Helpful index for category filtering and compound queries
knowledgeChunkSchema.index({ category: 1, documentId: 1 });

const KnowledgeChunk = mongoose.model("KnowledgeChunk", knowledgeChunkSchema);

module.exports = KnowledgeChunk;
