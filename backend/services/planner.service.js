const { GoogleGenAI } = require("@google/genai");
const TacticalPlan = require("../models/tacticalPlan.model");
const footballService = require("./football.service");
const memoryService = require("./memory.service");
const qdrantService = require("./qdrant.service");
const { generateEmbedding } = require("./embedding.service");
const logger = require("../config/logger");

const apiKey = process.env.GEMINI_API_KEY;
let aiClient = null;
if (apiKey) {
  aiClient = new GoogleGenAI({ apiKey });
}

/**
 * Pre-defined prompt templates for quick goal generation.
 */
const PLANNER_TEMPLATES = [
  {
    id: "match_preparation",
    title: "Pre-Match Game Plan",
    category: "match_preparation",
    description: "Generate a comprehensive tactical blueprint, starting XI, defensive triggers, and in-game contingencies against a specific opponent.",
    examplePrompt: "Prepare a complete match game plan for our upcoming match against Manchester City.",
  },
  {
    id: "low_block_breakdown",
    title: "Break Down Low-Block Defense",
    category: "match_preparation",
    description: "Formulate specialized passing overloads, half-space penetration routes, and rest-defense strategies against a deep defensive block.",
    examplePrompt: "Create a tactical plan to break down an aggressive 5-4-1 low-block defense.",
  },
  {
    id: "scouting_campaign",
    title: "Scouting & Target Shortlist",
    category: "scouting_campaign",
    description: "Define statistical criteria, tactical role requirements, and build a 3-tier shortlist for an essential position replacement.",
    examplePrompt: "Scout an inverted left winger under €35M with high pressing intensity and progressive carrying metrics.",
  },
  {
    id: "tactical_drill_progression",
    title: "Tactical System Transition (4-Week)",
    category: "tactical_drill_progression",
    description: "Design a 4-week tactical drill progression to transition your squad into a new build-up and pressing philosophy.",
    examplePrompt: "Design a 4-week training progression to transition our squad from 4-2-3-1 to a 3-2-4-1 box midfield build-up.",
  },
];

/**
 * Gathers relevant context from football APIs, RAG knowledge, and user memory.
 */
async function gatherContextForGoal(userId, goal, planType) {
  const gathered = {
    footballData: null,
    ragKnowledge: [],
    recalledMemories: [],
    memoryPromptBlock: "",
  };

  try {
    // 1. Recall User Memory & Profile
    if (userId) {
      const memoryResult = await memoryService.recallUserContext(userId, goal, {
        maxFacts: 4,
      });
      gathered.recalledMemories = memoryResult.recalledMemories || [];
      gathered.memoryPromptBlock = memoryResult.memoryPromptBlock || "";
    }

    // 2. Query Qdrant Tactical Knowledge Base (RAG)
    try {
      const queryVector = await generateEmbedding(goal);
      if (queryVector && queryVector.length > 0) {
        const chunks = await qdrantService.searchChunks({
          queryVector,
          limit: 3,
          scoreThreshold: 0.35,
        });
        gathered.ragKnowledge = (chunks || []).map((c) => ({
          title: c.documentTitle || "Tactical Guide",
          category: c.category || "Tactics",
          content: c.content ? c.content.slice(0, 400) : "",
        }));
      }
    } catch (ragErr) {
      logger.warn(`[PlannerService] RAG retrieval skipped: ${ragErr.message}`);
    }

    // 3. Match / Team Data Lookup (if opponent is mentioned)
    try {
      const teamMatches = await footballService.searchMatches(goal);
      if (teamMatches && teamMatches.length > 0) {
        gathered.footballData = {
          relevantMatches: teamMatches.slice(0, 3).map((m) => ({
            home: m.homeTeam?.name || m.homeTeam,
            away: m.awayTeam?.name || m.awayTeam,
            status: m.status,
            score: m.score,
            date: m.utcDate,
          })),
        };
      }
    } catch (teamErr) {
      logger.warn(`[PlannerService] Football data search skipped: ${teamErr.message}`);
    }
  } catch (error) {
    logger.warn(`[PlannerService] Context gathering warning: ${error.message}`);
  }

  return gathered;
}

/**
 * Synthesizes the tactical masterplan using Gemini.
 */
async function synthesizeMasterplan(goal, planType, context) {
  if (!aiClient) {
    throw new Error("AI client is not configured. Please verify GEMINI_API_KEY.");
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";

  const systemInstructions = `You are Football Copilot's Elite Tactical Mastermind & Match Planning Agent.
Your objective is to decompose the user's football goal into an actionable, professional-grade Tactical Masterplan.

Follow these tactical standards:
1. Deconstruct the plan into 3 to 5 logical phases (e.g. "Opposition Breakdown", "In-Possession Build-up", "Pressing & Defensive Shape", "Set-Piece Routines", "In-Game Contingencies").
2. Each phase MUST contain actionable strategic bullet points and 2-4 concrete, actionable checklist tasks that a manager/coach can complete.
3. If this is a Match Preparation or Tactical plan, propose a Starting XI with tactical roles (e.g. "Inverted Wingback", "Box-to-Box Mezzala") and key substitution triggers.
4. If this is a Scouting plan, structure phases around Profiling, Shortlisting, and Negotiation/Evaluation.
5. Provide 2-3 realistic in-game or campaign contingency scenarios with recommended corrective actions.
6. Incorporate user tactical preferences naturally when provided in context.

Return a strictly valid JSON response matching this schema:
{
  "title": "Clear, professional title of the plan",
  "planType": "${planType || "match_preparation"}",
  "opponent": {
    "name": "Opponent team name if applicable, or empty string",
    "league": "League name if applicable, or empty string",
    "matchDate": "Upcoming date if applicable, or empty string"
  },
  "overview": "2-3 sentence executive summary explaining the primary game-plan objective and tactical philosophy.",
  "lineupRecommendation": {
    "formation": "4-3-3 | 4-2-3-1 | 3-2-4-1 | 3-5-2 etc.",
    "style": "High Pressing / Positional Play / Counter-Attack / Low Block",
    "startingXI": [
      {
        "position": "GK / RB / CB / LB / DM / CM / RW / LW / ST",
        "player": "Player Name or Tactical Profile (e.g. Ball-Playing Defender)",
        "role": "Specific role (e.g. Inverted Wingback)",
        "keyInstruction": "Primary instruction (e.g. Underlap into right half-space on 2nd phase build-up)"
      }
    ],
    "substitutions": [
      {
        "minute": "60'-70'",
        "outPlayer": "Player or Position",
        "inPlayer": "Impact Sub",
        "tacticalTrigger": "If struggling to break low block / Protect defensive lead"
      }
    ]
  },
  "phases": [
    {
      "phaseName": "Name of the tactical phase",
      "objective": "Clear single-sentence target for this phase",
      "tactics": [
        "Tactical instruction 1",
        "Tactical instruction 2",
        "Tactical instruction 3"
      ],
      "checklist": [
        { "task": "Actionable task for staff/player (e.g. Deliver video analysis on opponent left-flank overloads)" },
        { "task": "Actionable task for training ground" }
      ]
    }
  ],
  "contingencies": [
    {
      "scenario": "Trailing 0-1 at 65' or Red Card Conceded",
      "action": "Tactical pivot and shape alteration instruction"
    }
  ]
}`;

  let contextSnippet = "";
  if (context.memoryPromptBlock) {
    contextSnippet += `\n${context.memoryPromptBlock}\n`;
  }
  if (context.ragKnowledge && context.ragKnowledge.length > 0) {
    contextSnippet += `\n### 📚 TACTICAL KNOWLEDGE RETRIEVED:\n` +
      context.ragKnowledge.map((k) => `• [${k.title}]: ${k.content}`).join("\n");
  }
  if (context.footballData?.relevantMatches) {
    contextSnippet += `\n### ⚽ RECENT OPPOSITION & MATCH DATA:\n` +
      JSON.stringify(context.footballData.relevantMatches, null, 2);
  }

  const prompt = `User Goal: "${goal}"
Selected Template Type: ${planType || "match_preparation"}

Context & Data:
${contextSnippet || "No extra database records provided. Use expert modern football coaching principles."}

Generate the complete Tactical Masterplan JSON.`;

  const response = await aiClient.models.generateContent({
    model: modelName,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction: systemInstructions,
      temperature: 0.35,
      responseMimeType: "application/json",
    },
  });

  if (!response || !response.text) {
    throw new Error("Empty response received from AI model.");
  }

  const parsed = JSON.parse(response.text);
  return parsed;
}

/**
 * End-to-end execution: creates, synthesizes, and saves a Tactical Plan.
 */
async function createTacticalPlan(userId, { goal, planType = "match_preparation", opponent = {} }) {
  if (!goal || typeof goal !== "string" || !goal.trim()) {
    throw new Error("Goal statement is required to create a tactical plan.");
  }

  logger.info(`[PlannerService] Generating tactical plan for user '${userId}': "${goal}"`);

  // 1. Gather tools & RAG & user memory context
  const context = await gatherContextForGoal(userId, goal.trim(), planType);

  // 2. Synthesize with Gemini
  const generated = await synthesizeMasterplan(goal.trim(), planType, context);

  // 3. Format checklist items with completed=false
  const formattedPhases = (generated.phases || []).map((phase) => ({
    phaseName: phase.phaseName || "Tactical Phase",
    objective: phase.objective || "",
    tactics: phase.tactics || [],
    checklist: (phase.checklist || []).map((item) => ({
      task: item.task,
      isCompleted: false,
      completedAt: null,
    })),
  }));

  // 4. Save to MongoDB
  const plan = new TacticalPlan({
    userId,
    title: generated.title || `Tactical Plan: ${goal.slice(0, 40)}`,
    planType: generated.planType || planType,
    opponent: {
      name: generated.opponent?.name || opponent.name || "",
      teamId: opponent.teamId || null,
      league: generated.opponent?.league || opponent.league || "",
      matchDate: generated.opponent?.matchDate || opponent.matchDate || "",
    },
    status: "in_progress",
    overview: generated.overview || "",
    lineupRecommendation: generated.lineupRecommendation || {},
    phases: formattedPhases,
    contingencies: generated.contingencies || [],
    recalledMemories: context.recalledMemories || [],
    sources: context.ragKnowledge || [],
    rawGoal: goal.trim(),
  });

  const savedPlan = await plan.save();
  logger.info(`[PlannerService] Created TacticalPlan '${savedPlan._id}' successfully.`);

  return savedPlan;
}

/**
 * Retrieves list of user's tactical plans.
 */
async function getUserPlans(userId, { status, planType, limit = 20, page = 1 } = {}) {
  const query = { userId };
  if (status && status !== "all") query.status = status;
  if (planType && planType !== "all") query.planType = planType;

  const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10)));

  const [plans, total] = await Promise.all([
    TacticalPlan.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .lean(),
    TacticalPlan.countDocuments(query),
  ]);

  return { plans, total, page: parseInt(page, 10), limit: parsedLimit };
}

/**
 * Retrieves a single tactical plan by ID.
 */
async function getPlanById(userId, planId) {
  return await TacticalPlan.findOne({ _id: planId, userId });
}

/**
 * Toggles a checklist item in a specific phase.
 */
async function toggleChecklistItem(userId, planId, phaseId, itemId, isCompleted) {
  const plan = await TacticalPlan.findOne({ _id: planId, userId });
  if (!plan) return null;

  let found = false;
  for (const phase of plan.phases) {
    if (phase._id.toString() === phaseId.toString()) {
      const item = phase.checklist.id(itemId);
      if (item) {
        item.isCompleted = typeof isCompleted === "boolean" ? isCompleted : !item.isCompleted;
        item.completedAt = item.isCompleted ? new Date() : null;
        found = true;
        break;
      }
    }
  }

  if (!found) {
    // Try finding by item ID directly across all phases
    for (const phase of plan.phases) {
      const item = phase.checklist.id(itemId);
      if (item) {
        item.isCompleted = typeof isCompleted === "boolean" ? isCompleted : !item.isCompleted;
        item.completedAt = item.isCompleted ? new Date() : null;
        found = true;
        break;
      }
    }
  }

  if (found) {
    // Check if all items across all phases are completed
    const allItems = plan.phases.flatMap((p) => p.checklist);
    const completedItems = allItems.filter((i) => i.isCompleted);
    if (allItems.length > 0 && completedItems.length === allItems.length) {
      plan.status = "completed";
    } else if (plan.status === "completed") {
      plan.status = "in_progress";
    }

    await plan.save();
  }

  return plan;
}

/**
 * Updates plan status (draft, in_progress, completed, archived).
 */
async function updatePlanStatus(userId, planId, status) {
  const plan = await TacticalPlan.findOne({ _id: planId, userId });
  if (!plan) return null;

  if (["draft", "in_progress", "completed", "archived"].includes(status)) {
    plan.status = status;
    await plan.save();
  }

  return plan;
}

/**
 * Deletes a tactical plan.
 */
async function deletePlan(userId, planId) {
  const deleted = await TacticalPlan.findOneAndDelete({ _id: planId, userId });
  return !!deleted;
}

module.exports = {
  PLANNER_TEMPLATES,
  createTacticalPlan,
  getUserPlans,
  getPlanById,
  toggleChecklistItem,
  updatePlanStatus,
  deletePlan,
};
