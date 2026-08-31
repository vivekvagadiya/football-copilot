const mongoose = require("mongoose");

const chunkSchema = new mongoose.Schema(
  {
    chunkIndex: {
      type: Number,
      required: true,
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
  },
  { _id: true }
);

const knowledgeDocumentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
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
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    rawContent: {
      type: String,
      required: true,
    },
    chunks: [chunkSchema],
    chunkCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast retrieval & text matching
knowledgeDocumentSchema.index({ tags: 1 });
knowledgeDocumentSchema.index({ "chunks.keywords": 1 });
knowledgeDocumentSchema.index({
  title: "text",
  "chunks.content": "text",
  tags: "text",
});

const KnowledgeDocument = mongoose.model(
  "KnowledgeDocument",
  knowledgeDocumentSchema
);

module.exports = KnowledgeDocument;
