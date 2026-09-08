const { GoogleGenAI } = require("@google/genai");
const UserMemory = require("../models/userMemory.model");
const AiConversation = require("../models/aiConversation.model");
const qdrantService = require("./qdrant.service");
const { generateEmbedding } = require("./embedding.service");
const logger = require("../config/logger");

const apiKey = process.env.GEMINI_API_KEY;
let aiClient = null;
if (apiKey) {
  aiClient = new GoogleGenAI({ apiKey });
}

/**
 * Recalls relevant semantic facts and episodic memories for a user based on the current prompt.
 *
 * @param {string|Object} userId - MongoDB User ID
 * @param {string} currentPrompt - The message sent by the user
 * @param {Object} [options]
 * @param {string} [options.category] - Optional category filter
 * @param {number} [options.maxFacts=5] - Max facts to inject
 * @param {number} [options.maxEpisodics=2] - Max episodic summaries to inject
 * @returns {Promise<{memoryPromptBlock: string, recalledMemories: Array<Object>}>}
 */
async function recallUserContext(userId, currentPrompt, options = {}) {
  if (!userId || !currentPrompt || typeof currentPrompt !== "string") {
    return { memoryPromptBlock: "", recalledMemories: [] };
  }

  const { category, maxFacts = 5, maxEpisodics = 2 } = options;

  try {
    const startTime = Date.now();

    // 1. Generate query embedding
    let queryVector = [];
    try {
      queryVector = await generateEmbedding(currentPrompt);
    } catch (embedErr) {
      logger.warn(`[MemoryService] Query vectorization skipped: ${embedErr.message}`);
    }

    // 2. Query Qdrant for semantic facts and episodic summaries in parallel
    const [qdrantFacts, qdrantEpisodics, fallbackMongoMemories] = await Promise.all([
      queryVector.length > 0
        ? qdrantService.searchUserFacts({
            userId,
            queryVector,
            category,
            limit: maxFacts,
            scoreThreshold: 0.38,
          })
        : [],
      queryVector.length > 0
        ? qdrantService.searchUserEpisodicMemories({
            userId,
            queryVector,
            limit: maxEpisodics,
            scoreThreshold: 0.35,
          })
        : [],
      // Fallback/Top explicit preferences from Mongo
      UserMemory.find({ userId, isActive: true })
        .sort({ updatedAt: -1 })
        .limit(6)
        .lean(),
    ]);

    const recalledMemories = [];
    const factLines = [];
    const episodicLines = [];
    const seenFacts = new Set();

    // Prioritize vector-retrieved facts
    for (const item of qdrantFacts) {
      if (item.fact && !seenFacts.has(item.fact.toLowerCase())) {
        seenFacts.add(item.fact.toLowerCase());
        factLines.push(`• [${item.category || "Preference"}]: ${item.fact}`);
        recalledMemories.push({
          memoryId: item.memoryId,
          category: item.category,
          fact: item.fact,
          type: "fact",
          score: item.score,
        });
      }
    }

    // Complement with high-priority active mongo facts if vector results are scarce
    if (factLines.length < maxFacts) {
      for (const m of fallbackMongoMemories) {
        if (!seenFacts.has(m.fact.toLowerCase())) {
          seenFacts.add(m.fact.toLowerCase());
          factLines.push(`• [${m.category || "Profile"}]: ${m.fact}`);
          recalledMemories.push({
            memoryId: m._id,
            category: m.category,
            fact: m.fact,
            type: "fact",
          });
          if (factLines.length >= maxFacts) break;
        }
      }
    }

    // Add episodic memories
    for (const ep of qdrantEpisodics) {
      if (ep.summary) {
        episodicLines.push(`• Past Session: ${ep.summary}`);
        recalledMemories.push({
          memoryId: ep.conversationId,
          category: "episodic",
          fact: ep.summary,
          type: "episodic",
          score: ep.score,
        });
      }
    }

    let memoryPromptBlock = "";
    if (factLines.length > 0 || episodicLines.length > 0) {
      memoryPromptBlock = [
        "### 🧠 RECALLED USER PROFILE & PERSONALIZED MEMORY:",
        factLines.length > 0 ? "User Preferences & Tactical Profile:\n" + factLines.join("\n") : "",
        episodicLines.length > 0 ? "Past Relevant Dialogues & Analysis:\n" + episodicLines.join("\n") : "",
        "Use this context naturally to tailor formations, recommendations, scout targets, and tone without explicitly repeating 'As per your memory' unless relevant.",
      ]
        .filter(Boolean)
        .join("\n\n");
    }

    const duration = Date.now() - startTime;
    logger.info(
      `[MemoryService] Context recall completed in ${duration}ms (Facts: ${factLines.length}, Episodics: ${episodicLines.length})`
    );

    return {
      memoryPromptBlock,
      recalledMemories,
    };
  } catch (error) {
    logger.error(`[MemoryService] Error during recallUserContext: ${error.message}`, error);
    return { memoryPromptBlock: "", recalledMemories: [] };
  }
}

/**
 * Extracts long-term facts and preferences from recent dialogue turns using Gemini.
 * Runs asynchronously in the background.
 *
 * @param {string|Object} userId
 * @param {string|Object} conversationId
 * @param {Array<{sender: string, text: string}>} messages
 */
async function extractFactsFromTurns(userId, conversationId, messages = []) {
  if (!aiClient || !userId || !messages || messages.length === 0) return;

  try {
    const userMessages = messages.filter((m) => m.sender === "user");
    if (userMessages.length === 0) return;

    // Take the last 3 user messages to avoid processing ancient history
    const recentDialogue = messages
      .slice(-6)
      .map((m) => `${m.sender.toUpperCase()}: ${m.text}`)
      .join("\n");

    const extractionPrompt = `You are Football Copilot's Memory Extraction Subsystem.
Analyze the following football conversation snippet and extract any PERMANENT facts, preferences, tactical philosophies, favorite teams/players, or scouting constraints stated by the USER.

Rules:
1. ONLY extract clear, long-term personal facts or preferences explicitly stated by the user (e.g., "I support Arsenal", "We play 4-3-3 high press", "Looking for U21 wingers in Portugal", "I dislike low blocks").
2. DO NOT extract temporary queries or casual questions (e.g., "What time is the match?" or "Who won the World Cup?" are NOT facts).
3. Classify each fact into one category: "tactical_preference", "team_loyalty", "player_interest", "scouting_criteria", or "general".
4. If no permanent facts are present, return an empty array.

Conversation snippet:
${recentDialogue}

Return a valid JSON object matching this schema:
{
  "extractedFacts": [
    {
      "fact": "Concise factual statement in 3rd person or direct preference (e.g. 'Supports Arsenal', 'Prefers 4-3-3 formation with inverted wingers')",
      "category": "tactical_preference | team_loyalty | player_interest | scouting_criteria | general",
      "confidence": 0.9
    }
  ]
}`;

    const envModel = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const response = await aiClient.models.generateContent({
      model: envModel,
      contents: [{ role: "user", parts: [{ text: extractionPrompt }] }],
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    if (!response || !response.text) return;

    const parsed = JSON.parse(response.text);
    const facts = parsed.extractedFacts || [];

    for (const item of facts) {
      if (!item.fact || typeof item.fact !== "string" || item.fact.trim().length < 4) continue;

      const trimmedFact = item.fact.trim();

      // Check if similar fact already exists in MongoDB
      const existing = await UserMemory.findOne({
        userId,
        fact: { $regex: new RegExp(`^${trimmedFact.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        isActive: true,
      });

      if (!existing) {
        const newMemory = new UserMemory({
          userId,
          category: item.category || "general",
          fact: trimmedFact,
          confidence: item.confidence || 0.85,
          sourceConversationId: conversationId || null,
        });

        const savedMemory = await newMemory.save();

        // Vectorize and upsert into Qdrant
        try {
          const embedding = await generateEmbedding(trimmedFact);
          if (embedding && embedding.length > 0) {
            const pointId = await qdrantService.upsertUserFactVector({
              memoryId: savedMemory._id,
              userId,
              fact: trimmedFact,
              category: item.category || "general",
              embedding,
            });
            if (pointId) {
              savedMemory.qdrantPointId = pointId;
              await savedMemory.save();
            }
          }
        } catch (vecErr) {
          logger.warn(`[MemoryService] Failed to vectorize fact '${trimmedFact}': ${vecErr.message}`);
        }

        logger.info(`[MemoryService] Learned new user fact for '${userId}': "${trimmedFact}"`);
      }
    }
  } catch (error) {
    logger.warn(`[MemoryService] Fact extraction error: ${error.message}`);
  }
}

/**
 * Summarizes an ongoing conversation and archives it as an episodic memory in Qdrant.
 *
 * @param {string|Object} userId
 * @param {string|Object} conversationId
 */
async function summarizeAndArchiveConversation(userId, conversationId) {
  if (!aiClient || !userId || !conversationId) return;

  try {
    const conversation = await AiConversation.findOne({ _id: conversationId, userId });
    if (!conversation || conversation.messages.length < 6) return;

    // Skip if summarized recently
    if (
      conversation.memorySyncedAt &&
      Date.now() - new Date(conversation.memorySyncedAt).getTime() < 1000 * 60 * 15 &&
      conversation.messages.length < 15
    ) {
      return;
    }

    const conversationText = conversation.messages
      .map((m) => `${m.sender.toUpperCase()}: ${m.text}`)
      .join("\n");

    const prompt = `Summarize this football conversation thread into a concise 2-sentence episodic memory note and 3-5 keyword topics.
Thread:
${conversationText}

Return JSON matching:
{
  "summary": "2-sentence summary highlighting key football analysis, teams evaluated, or tactical setups discussed.",
  "keyTopics": ["topic1", "topic2"]
}`;

    const envModel = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const response = await aiClient.models.generateContent({
      model: envModel,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    });

    if (!response || !response.text) return;

    const parsed = JSON.parse(response.text);
    if (!parsed.summary) return;

    conversation.summary = parsed.summary;
    conversation.memorySyncedAt = new Date();
    await conversation.save();

    // Vectorize episodic summary
    const embedding = await generateEmbedding(parsed.summary + " " + (parsed.keyTopics || []).join(" "));
    if (embedding && embedding.length > 0) {
      await qdrantService.upsertUserEpisodicVector({
        conversationId: conversation._id,
        userId,
        summary: parsed.summary,
        keyTopics: parsed.keyTopics || [],
        embedding,
      });
      logger.info(`[MemoryService] Archived episodic memory for conversation '${conversationId}'.`);
    }
  } catch (error) {
    logger.warn(`[MemoryService] Summarization error: ${error.message}`);
  }
}

/**
 * Get all active memories for a user.
 */
async function getUserMemories(userId, filters = {}) {
  const query = { userId, isActive: true };
  if (filters.category && filters.category !== "all") {
    query.category = filters.category;
  }
  return await UserMemory.find(query).sort({ updatedAt: -1 }).lean();
}

/**
 * Manually add a user memory fact.
 */
async function createUserMemory(userId, { fact, category = "general", confidence = 1.0 }) {
  if (!fact || !fact.trim()) {
    throw new Error("Fact string is required.");
  }

  const memory = new UserMemory({
    userId,
    fact: fact.trim(),
    category,
    confidence,
  });

  const saved = await memory.save();

  try {
    const embedding = await generateEmbedding(saved.fact);
    if (embedding && embedding.length > 0) {
      const pointId = await qdrantService.upsertUserFactVector({
        memoryId: saved._id,
        userId,
        fact: saved.fact,
        category: saved.category,
        embedding,
      });
      if (pointId) {
        saved.qdrantPointId = pointId;
        await saved.save();
      }
    }
  } catch (err) {
    logger.warn(`[MemoryService] Manual fact vectorization warning: ${err.message}`);
  }

  return saved;
}

/**
 * Update an existing memory fact.
 */
async function updateUserMemory(userId, memoryId, updateData = {}) {
  const memory = await UserMemory.findOne({ _id: memoryId, userId });
  if (!memory) return null;

  if (updateData.fact !== undefined) memory.fact = updateData.fact.trim();
  if (updateData.category !== undefined) memory.category = updateData.category;
  if (updateData.isActive !== undefined) memory.isActive = Boolean(updateData.isActive);

  const updated = await memory.save();

  if (updated.isActive && updateData.fact) {
    try {
      const embedding = await generateEmbedding(updated.fact);
      await qdrantService.upsertUserFactVector({
        memoryId: updated._id,
        userId,
        fact: updated.fact,
        category: updated.category,
        embedding,
      });
    } catch (err) {
      logger.warn(`[MemoryService] Memory re-vectorization warning: ${err.message}`);
    }
  } else if (!updated.isActive) {
    await qdrantService.deleteUserFactVector(memoryId);
  }

  return updated;
}

/**
 * Delete a user memory by ID.
 */
async function deleteMemory(userId, memoryId) {
  const deleted = await UserMemory.findOneAndDelete({ _id: memoryId, userId });
  if (!deleted) return false;

  await qdrantService.deleteUserFactVector(memoryId);
  return true;
}

/**
 * Clear all memories and vectors for a user.
 */
async function clearAllMemories(userId) {
  const result = await UserMemory.deleteMany({ userId });
  await qdrantService.clearAllUserVectors(userId);
  return result.deletedCount;
}

module.exports = {
  recallUserContext,
  extractFactsFromTurns,
  summarizeAndArchiveConversation,
  getUserMemories,
  createUserMemory,
  updateUserMemory,
  deleteMemory,
  clearAllMemories,
};
