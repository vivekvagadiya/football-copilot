require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const KnowledgeChunk = require("../models/knowledgeChunk.model");
const { ensureQdrantCollection } = require("../config/qdrant");
const { upsertChunkVectors, getCollectionStats } = require("../services/qdrant.service");
const logger = require("../config/logger");

const MONGO_URI = process.env.MONGO_URI;

/**
 * Migration & Sync Script: Reads all KnowledgeChunks from MongoDB and syncs embeddings into Qdrant.
 */
async function syncMongoDBToQdrant() {
  console.log("🚀 Starting MongoDB KnowledgeChunk -> Qdrant Vector Sync...");

  if (!MONGO_URI) {
    console.error("❌ MONGO_URI is missing from environment variables.");
    process.exit(1);
  }

  try {
    // 1. Connect to MongoDB
    console.log("📡 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB.");

    // 2. Ensure Qdrant collection is created
    console.log("📡 Ensuring Qdrant Collection exists...");
    const isReady = await ensureQdrantCollection();
    if (!isReady) {
      console.error("❌ Unable to connect to Qdrant. Please make sure Qdrant container/service is running at QDRANT_URL.");
      process.exit(1);
    }

    // 3. Fetch all chunks with non-empty embeddings
    console.log("🔍 Querying KnowledgeChunks from MongoDB...");
    const chunks = await KnowledgeChunk.find({
      embedding: { $exists: true, $not: { $size: 0 } },
    }).lean();

    console.log(`📦 Found ${chunks.length} chunks with valid embeddings in MongoDB.`);

    if (chunks.length === 0) {
      console.log("ℹ️ No chunks to sync. Run 'npm run seed:knowledge' to populate initial RAG data first.");
      process.exit(0);
    }

    // 4. Batch upsert into Qdrant
    const BATCH_SIZE = 50;
    let syncedCount = 0;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const success = await upsertChunkVectors(batch);
      if (success) {
        syncedCount += batch.length;
        console.log(`⚡ Synced batch ${i / BATCH_SIZE + 1} (${syncedCount}/${chunks.length} chunks)...`);
      } else {
        console.warn(`⚠️ Batch ${i / BATCH_SIZE + 1} sync encountered warnings.`);
      }
    }

    // 5. Verify stats
    const stats = await getCollectionStats();
    console.log("\n🎉 --- Sync Complete ---");
    console.log(`Total Chunks Synced: ${syncedCount}`);
    console.log(`Qdrant Collection Vector Count: ${stats.vectorsCount}`);
    console.log(`Qdrant Status: ${stats.status}`);
  } catch (error) {
    console.error(`❌ Sync error: ${error.message}`, error);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Closed MongoDB connection.");
    process.exit(0);
  }
}

// Execute sync
syncMongoDBToQdrant();
