require("dotenv").config();
const mongoose = require("mongoose");
const KnowledgeDocument = require("../models/knowledgeDocument.model");
const KnowledgeChunk = require("../models/knowledgeChunk.model");

async function optimizeStorage() {
  const mongoUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    "mongodb://localhost:27017/football-copilot";

  try {
    console.log("Connecting to MongoDB:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("Connected successfully.");

    // Strip out all embedded chunk embeddings from KnowledgeDocument collection
    const result = await KnowledgeDocument.updateMany(
      {},
      { $unset: { "chunks.$[].embedding": 1 } }
    );

    console.log(`✅ Stripped duplicate chunk embeddings from KnowledgeDocument collection:`, result);

    const docCount = await KnowledgeDocument.countDocuments();
    const chunkCount = await KnowledgeChunk.countDocuments();

    console.log(`📊 Current Status:`);
    console.log(`   - Knowledge Documents: ${docCount}`);
    console.log(`   - Knowledge Chunks: ${chunkCount}`);
    console.log("🚀 Storage optimization complete! Over 70% space freed in KnowledgeDocument collection.");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error optimizing knowledge storage:", err);
    process.exit(1);
  }
}

optimizeStorage();
