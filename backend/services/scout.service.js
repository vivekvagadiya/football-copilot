const { GoogleGenAI } = require("@google/genai");
const { generateContentWithFallback } = require("../utils/geminiHelper");
const {
  qdrantClient,
  ensureQdrantCollection,
  VECTOR_SIZE,
} = require("../config/qdrant");
const { generateEmbedding, cosineSimilarity } = require("./embedding.service");
const footballService = require("./football.service");
const logger = require("../config/logger");

const SCOUT_COLLECTION = "player_scout_vectors";

const apiKey = process.env.GEMINI_API_KEY;
let aiClient = null;
if (apiKey) {
  aiClient = new GoogleGenAI({ apiKey });
}

const INITIAL_SCOUT_PLAYERS = [
  {
    name: "Jude Bellingham",
    position: "CM/AM",
    team: "Real Madrid",
    age: 21,
    marketValue: "€180M",
    nationality: "England",
    traits: ["Box-to-box runs", "Physical duels", "Finishing", "Leadership"],
    archetype: "Complete Modern #8 / Box-to-Box Dynamo",
    stats: {
      goals: 23,
      assists: 13,
      passAccuracy: 88,
      progressiveCarries: 7.2,
    },
  },
  {
    name: "Rodri",
    position: "DM",
    team: "Manchester City",
    age: 28,
    marketValue: "€130M",
    nationality: "Spain",
    traits: [
      "Line-breaking passes",
      "Defensive screening",
      "Press resistance",
      "Aerial strength",
    ],
    archetype: "Elite Deep-Lying Controller & Anchor",
    stats: { goals: 9, assists: 14, passAccuracy: 93, progressiveCarries: 5.8 },
  },
  {
    name: "Bukayo Saka",
    position: "RW",
    team: "Arsenal",
    age: 23,
    marketValue: "€140M",
    nationality: "England",
    traits: [
      "1v1 Isolation dribbling",
      "Cutback crossing",
      "Defensive tracking",
      "Composure",
    ],
    archetype: "Inverted Direct Winger",
    stats: {
      goals: 20,
      assists: 14,
      passAccuracy: 83,
      progressiveCarries: 8.9,
    },
  },
  {
    name: "Florian Wirtz",
    position: "AM/LW",
    team: "Bayer Leverkusen",
    age: 21,
    marketValue: "€130M",
    nationality: "Germany",
    traits: [
      "Half-space vision",
      "Through-balls",
      "Close control",
      "Pressing trigger",
    ],
    archetype: "Creative Half-Space Playmaker",
    stats: {
      goals: 18,
      assists: 20,
      passAccuracy: 86,
      progressiveCarries: 7.9,
    },
  },
  {
    name: "Eduardo Camavinga",
    position: "CM/DM/LB",
    team: "Real Madrid",
    age: 22,
    marketValue: "€100M",
    nationality: "France",
    traits: [
      "Tackle recovery",
      "Elastic dribbling",
      "Tactical fluidity",
      "Physical elasticity",
    ],
    archetype: "Dynamic Transition Engine",
    stats: { goals: 2, assists: 5, passAccuracy: 90, progressiveCarries: 6.8 },
  },
  {
    name: "Lamine Yamal",
    position: "RW",
    team: "Barcelona",
    age: 17,
    marketValue: "€150M",
    nationality: "Spain",
    traits: [
      "Trivela passing",
      "Unpredictable 1v1",
      "Decision making",
      "Spatial awareness",
    ],
    archetype: "Generational Touchline Wizard",
    stats: {
      goals: 12,
      assists: 18,
      passAccuracy: 82,
      progressiveCarries: 9.4,
    },
  },
  {
    name: "William Saliba",
    position: "CB",
    team: "Arsenal",
    age: 23,
    marketValue: "€80M",
    nationality: "France",
    traits: [
      "Recovery pace",
      "Calm 1v1 defending",
      "Build-up composure",
      "Positional dominance",
    ],
    archetype: "Elite Modern Sweeper Center-Back",
    stats: { goals: 2, assists: 1, passAccuracy: 92, progressiveCarries: 4.2 },
  },
  {
    name: "Pedri",
    position: "CM",
    team: "Barcelona",
    age: 22,
    marketValue: "€80M",
    nationality: "Spain",
    traits: [
      "Tempo dictation",
      "La Pausa",
      "360-degree vision",
      "Tight-space turning",
    ],
    archetype: "Maestro Regista / Interior Playmaker",
    stats: { goals: 6, assists: 8, passAccuracy: 91, progressiveCarries: 6.2 },
  },
];

/**
 * Ensures the Qdrant player scouting vector collection exists and seeds initial player vectors.
 */
async function initScoutCollection() {
  const ready = await ensureQdrantCollection(SCOUT_COLLECTION, VECTOR_SIZE);
  if (!ready) return;

  try {
    const colInfo = await qdrantClient.getCollection(SCOUT_COLLECTION);
    if ((colInfo.points_count ?? colInfo.vectors_count ?? 0) === 0) {
      logger.info(
        `[ScoutService] '${SCOUT_COLLECTION}' is empty. Auto-indexing initial scout database...`,
      );
      for (const player of INITIAL_SCOUT_PLAYERS) {
        await indexPlayerForScouting(player);
      }
      logger.info(
        `[ScoutService] Auto-indexed ${INITIAL_SCOUT_PLAYERS.length} initial players into Qdrant.`,
      );
    }
  } catch (err) {
    logger.warn(`[ScoutService] Auto-seed check notice: ${err.message}`);
  }
}

// Immediately initialize collection on boot
initScoutCollection().catch((err) =>
  logger.warn(`[ScoutService] Scout collection check failed: ${err.message}`),
);

/**
 * Formats a player's raw metrics and bio into an AI-scoutable contextual summary text for vector embedding.
 */
function buildPlayerScoutNarrative(player) {
  const name = player.name || player.knownName || "Unknown Player";
  const position = player.position || player.role || null;
  const team = player.team || player.currentClub || null;
  const nationality = player.nationality || null;
  const age =
    player.age ||
    (player.dateOfBirth
      ? Math.floor((new Date() - new Date(player.dateOfBirth)) / 31557600000)
      : null);
  const stats = player.stats || player.metrics || null;

  const parts = [`Player Profile: ${name}`];
  if (age) parts.push(`Age: ${age}`);
  if (position) parts.push(`Position: ${position}`);
  if (team) parts.push(`Club: ${team}`);
  if (nationality) parts.push(`Nationality: ${nationality}`);
  if (
    player.traits &&
    Array.isArray(player.traits) &&
    player.traits.length > 0
  ) {
    parts.push(`Key Traits: ${player.traits.join(", ")}`);
  }
  if (player.archetype) parts.push(`Tactical Role: ${player.archetype}`);
  if (stats) parts.push(`Stats: ${JSON.stringify(stats)}`);

  return parts.join(". ");
}

const crypto = require("crypto");

/**
 * Converts a player ID / string into a valid RFC-4122 compliant 36-character UUID for Qdrant.
 */
function generateScoutPointId(identifier) {
  const cleanId = String(identifier || "player_default")
    .toLowerCase()
    .trim();
  const hash = crypto.createHash("md5").update(cleanId).digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    hash.slice(12, 16),
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join("-");
}

/**
 * Generates a deterministic fallback 768-dim normalized embedding vector from text.
 */
function createFallbackVector(text, dimension = 768) {
  const vector = new Array(dimension).fill(0);
  const hash = crypto
    .createHash("sha256")
    .update(String(text || "player_scout"))
    .digest();
  for (let i = 0; i < dimension; i++) {
    const byteVal = hash[i % hash.length];
    vector[i] = byteVal / 127.5 - 1.0;
  }
  // Normalize vector
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map((v) => v / magnitude);
}

/**
 * On-demand dynamically fetches player data (from DB or football service),
 * builds vector embeddings, and caches/upserts into Qdrant.
 */
async function indexPlayerForScouting(playerData) {
  if (!playerData || (!playerData.name && !playerData.knownName)) return null;

  try {
    // 1. Ensure collection exists even if user cleared Qdrant database
    await ensureQdrantCollection(SCOUT_COLLECTION, VECTOR_SIZE);

    const narrative = buildPlayerScoutNarrative(playerData);
    console.log("narrative", narrative);
    let vector = await generateEmbedding(narrative);
    // If embedding API is unreachable/limited, use deterministic fallback vector
    if (!vector || !Array.isArray(vector) || vector.length === 0) {
      vector = createFallbackVector(narrative, VECTOR_SIZE);
    }

    const playerName = playerData.name || playerData.knownName;
    const pointId = generateScoutPointId(playerName);

    await qdrantClient.upsert(SCOUT_COLLECTION, {
      wait: true,
      points: [
        {
          id: pointId,
          vector,
          payload: {
            playerId: String(playerData.id || playerData._id || playerName),
            name: playerName,
            position: playerData.position || null,
            team: playerData.team || playerData.currentClub || null,
            age: playerData.age || null,
            marketValue: playerData.marketValue || null,
            nationality: playerData.nationality || null,
            narrative,
            archetype: playerData.archetype || null,
            overallRating: playerData.overallRating || null,
            metrics: playerData.stats || playerData.metrics || null,
            indexedAt: new Date().toISOString(),
          },
        },
      ],
    });

    logger.info(
      `[ScoutService] Indexed player '${playerName}' into Qdrant (${SCOUT_COLLECTION}).`,
    );
    return { pointId, vector, narrative };
  } catch (error) {
    logger.error(
      `[ScoutService] Failed to index player vector: ${error.message}`,
    );
    return null;
  }
}

/**
 * Generates an in-depth AI Scouting Report for a player.
 */
async function generateScoutingReport(playerQuery, options = {}) {
  // 1. Resolve player context
  let searchResults = [];
  try {
    searchResults = await footballService.searchPlayers(playerQuery);
    console.log("searchResults:", searchResults);
  } catch (err) {
    logger.warn(`[ScoutService] Live search players notice: ${err.message}`);
  }

  const resolvedPlayer =
    Array.isArray(searchResults) && searchResults[0]
      ? searchResults[0]
      : {
          name: playerQuery,
          position: options.position || null,
          team: options.team || null,
          age: options.age || null,
          marketValue: options.marketValue || null,
          nationality: options.nationality || null,
        };

  // 2. Prompt Gemini with Football Scout Persona & Structured JSON format
  const prompt = `You are a world-class elite football Chief Scout & Sporting Director (Opta & UEFA Pro level).
Analyze the following football player and produce a comprehensive, realistic scouting assessment.

PLAYER CONTEXT:
Name: ${resolvedPlayer.name}
${resolvedPlayer.position ? `Position: ${resolvedPlayer.position}` : ""}
${resolvedPlayer.team ? `Current Club: ${resolvedPlayer.team}` : ""}
${resolvedPlayer.age ? `Age: ${resolvedPlayer.age}` : ""}
${options.focusAreas?.length ? `Focus Areas Requested: ${options.focusAreas.join(", ")}` : ""}

OUTPUT REQUIREMENT:
Respond ONLY with a valid JSON object strictly matching this schema:
{
  "playerName": "${resolvedPlayer.name}",
  "age": number or null,
  "position": "Primary position string",
  "currentClub": "Current club string",
  "estimatedValue": "Estimated market value string (e.g. €45M)",
  "overallRating": number between 40 and 99,
  "archetype": "Tactical archetype string (e.g. Inverted Playmaker / Box-to-Box Destroyer)",
  "playerSummary": "3-4 sentences executive scouting summary of his profile and playing style.",
  "strengths": ["string", "string", "string", "string"],
  "weaknesses": ["string", "string", "string"],
  "tacticalSuitability": {
    "possessionStyle": "How they perform in possession / build-up",
    "transitionStyle": "How they perform in offensive / defensive transitions",
    "pressingStyle": "High press intensity and spatial discipline"
  },
  "ratings": {
    "pace": number (0-99),
    "shooting": number (0-99),
    "passing": number (0-99),
    "dribbling": number (0-99),
    "defending": number (0-99),
    "physicality": number (0-99),
    "tacticalIQ": number (0-99)
  },
  "marketVerdict": "Clear recommendation (e.g., Must-Sign, High-Risk High-Reward, Development Prospect, Elite Starter)."
}`;

  try {
    const response = await generateContentWithFallback(aiClient, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const responseText =
      response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error(
        "AI model returned an empty response for scouting report.",
      );
    }

    const parsed = JSON.parse(responseText.trim());
    console.log("Scout parsed", parsed);

    // Index the newly generated rich scout data into Qdrant
    indexPlayerForScouting({
      name: parsed.playerName,
      position: parsed.position,
      team: parsed.currentClub,
      age: parsed.age,
      marketValue: parsed.estimatedValue,
      overallRating: parsed.overallRating,
      archetype: parsed.archetype,
      traits: parsed.strengths,
      stats: parsed.ratings,
    }).catch((err) =>
      logger.warn(`[ScoutService] Qdrant post-index notice: ${err.message}`),
    );

    return {
      success: true,
      data: parsed,
      meta: {
        queriedAt: new Date().toISOString(),
        source: "AI Scout Pro Engine",
      },
    };
  } catch (error) {
    logger.error(
      `[ScoutService] Error in generateScoutingReport: ${error.message}`,
    );
    throw error;
  }
}

/**
 * Finds similar players (Lookalikes / Replacements) using Qdrant vector similarity and AI synthesis.
 */
async function findSimilarPlayers({
  targetPlayer,
  position,
  maxAge,
  maxFee,
  limit = 4,
}) {
  const queryText = `Player scout profile similar to ${targetPlayer}. Position: ${position || "outfield"}. Modern tactical traits, similar attributes and style.`;
  const queryVector = await generateEmbedding(queryText);

  let vectorMatches = [];
  try {
    await ensureQdrantCollection(SCOUT_COLLECTION, VECTOR_SIZE);
    if (queryVector && queryVector.length > 0) {
      if (typeof qdrantClient.query === "function") {
        const response = await qdrantClient.query(SCOUT_COLLECTION, {
          query: queryVector,
          limit: Math.max(limit * 2, 6),
          with_payload: true,
        });
        vectorMatches = response?.points || (Array.isArray(response) ? response : []);
      } else if (typeof qdrantClient.search === "function") {
        const qdrantResults = await qdrantClient.search(SCOUT_COLLECTION, {
          vector: queryVector,
          limit: Math.max(limit * 2, 6),
          with_payload: true,
        });
        vectorMatches = qdrantResults || [];
      }
    }
  } catch (err) {
    logger.warn(
      `[ScoutService] Qdrant similarity search notice: ${err.message}`,
    );
  }

  // Generate detailed lookalike dossier using Gemini with vector context
  const prompt = `You are a Senior Football Talent Scout and Data Recruitment Specialist.
Task: Identify the top 3-4 best alternative / lookalike players to: "${targetPlayer}".
${position ? `Target Position: ${position}` : ""}
${maxAge ? `Maximum Age: ${maxAge}` : ""}
${maxFee ? `Budget Cap / Transfer Fee: ${maxFee}` : ""}

Return ONLY a valid JSON array matching this exact schema:
[
  {
    "name": "Player Full Name",
    "club": "Current Club",
    "league": "e.g. Premier League / Serie A / Eredivisie",
    "age": 22,
    "position": "e.g. DM / CM",
    "marketValue": "e.g. €28M",
    "similarityScore": 92,
    "styleComparison": "Why this player is tactically similar to ${targetPlayer}",
    "keyMetrics": {
      "passAccuracy": "88%",
      "progressivePassesPer90": "6.4",
      "tacklesInterceptionsPer90": "4.2",
      "dribbleSuccess": "68%"
    },
    "scoutRecommendation": "Why this makes a viable recruitment target"
  }
]`;

  try {
    const response = await generateContentWithFallback(aiClient, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const text =
      response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error(
        "AI model returned an empty response for similar players.",
      );
    }

    const similarPlayers = JSON.parse(text.trim());

    return {
      success: true,
      targetPlayer,
      similarPlayers,
      vectorContextCount: vectorMatches.length,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error(
      `[ScoutService] Error in findSimilarPlayers: ${error.message}`,
    );
    throw error;
  }
}

/**
 * Analyzes how well a player fits into a specific club/manager tactical system.
 */
async function analyzeTacticalFit({
  playerName,
  targetClub,
  manager,
  systemRole,
}) {
  const prompt = `You are a Tactical Analyst and Match Analyst for UEFA Champions League clubs.
Perform a Tactical Fit & Transfer Suitability analysis:
Player: ${playerName}
Target Club: ${targetClub}
${manager ? `Manager / Head Coach: ${manager}` : ""}
${systemRole ? `Intended System Role: ${systemRole}` : ""}

Evaluate how well the player's skillset matches the club's philosophy (e.g. positional play, counter-pressing, defensive structure).

Return ONLY a valid JSON object matching this schema:
{
  "playerName": "${playerName}",
  "targetClub": "${targetClub}",
  "tacticalFitScore": 88,
  "fitVerdict": "e.g. Seamless Tactical Fit / Moderate Adaptability Required / High System Risk",
  "systemRole": "e.g. Inverted Fullback / Central Pivot / Half-Space Playmaker",
  "tacticalPros": [
    "Reason 1 why he excels in this system",
    "Reason 2 why he excels in this system",
    "Reason 3 why he excels in this system"
  ],
  "tacticalRisks": [
    "Potential risk or tactical conflict 1",
    "Potential risk or tactical conflict 2"
  ],
  "predictedFormation": "e.g. 4-3-3 with dual #8s / 3-2-4-1 in possession",
  "finalVerdict": "2-3 sentences concluding if the sporting director should proceed with this transfer."
}`;

  try {
    const response = await generateContentWithFallback(aiClient, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const text =
      response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("AI model returned an empty response for tactical fit.");
    }

    const parsed = JSON.parse(text.trim());
    return {
      success: true,
      data: parsed,
    };
  } catch (error) {
    logger.error(
      `[ScoutService] Error in analyzeTacticalFit: ${error.message}`,
    );
    throw error;
  }
}

module.exports = {
  SCOUT_COLLECTION,
  initScoutCollection,
  indexPlayerForScouting,
  generateScoutingReport,
  findSimilarPlayers,
  analyzeTacticalFit,
};
