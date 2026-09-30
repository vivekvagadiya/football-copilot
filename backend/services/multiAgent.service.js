const { GoogleGenAI } = require("@google/genai");
const footballService = require("./football.service");
const memoryService = require("./memory.service");
const qdrantService = require("./qdrant.service");
const { generateEmbedding } = require("./embedding.service");
const { generateContentWithFallback, DEFAULT_LITE_MODEL } = require("../utils/geminiHelper");
const logger = require("../config/logger");

const apiKey = process.env.GEMINI_API_KEY;
let aiClient = null;
if (apiKey) {
  aiClient = new GoogleGenAI({ apiKey });
}

/**
 * Registry of all specialized backroom staff agents.
 */
const AGENTS_REGISTRY = [
  {
    id: "orchestrator",
    name: "Lead Orchestrator",
    title: "Director of Football",
    role: "Strategic Synthesis & Delegation",
    avatar: "👑",
    color: "#F59E0B",
    description: "Decomposes complex football objectives, delegates sub-tasks to specialists, and unifies their intelligence into an executive master report.",
    capabilities: ["Task Decomposition", "Conflict Resolution", "Executive Synthesis"],
  },
  {
    id: "tactical_analyst",
    name: "Tactical Analyst",
    title: "Chief Tactical Strategist",
    role: "Formations & In-Game Systems",
    avatar: "🎯",
    color: "#10B981",
    description: "Specializes in build-up structures (3-2-4-1, 4-3-3), pressing triggers, half-space overloads, transitional dynamics, and set-piece routines.",
    capabilities: ["Positional Play", "Pressing Schemes", "Rest-Defense", "Set-Piece Routines"],
  },
  {
    id: "chief_scout",
    name: "Chief Scout",
    title: "Head of Recruitment & Scouting",
    role: "Talent Scouting & Market Intelligence",
    avatar: "🔍",
    color: "#3B82F6",
    description: "Evaluates player radar data, progressive passing/carrying percentiles, market values, contract statuses, and produces tiered candidate shortlists.",
    capabilities: ["Data Scouting", "Valuation Benchmarking", "Talent Shortlisting", "Squad Depth Analysis"],
  },
  {
    id: "opposition_analyst",
    name: "Opposition Analyst",
    title: "Rival Scouting & Match Intelligence",
    role: "Opponent Form & Threat Assessment",
    avatar: "🏟️",
    color: "#8B5CF6",
    description: "Studies upcoming rivals, tracking recent match form, head-to-head records, key player danger zones, and injury/suspension reports.",
    capabilities: ["Opponent Breakdown", "Key Threat Isolation", "Head-to-Head Trends", "Injury Impact"],
  },
  {
    id: "ifab_specialist",
    name: "IFAB & Rules Specialist",
    title: "Compliance & Regulations Director",
    role: "Laws of the Game & Tournaments",
    avatar: "📖",
    color: "#EC4899",
    description: "Provides authoritative guidance on IFAB Laws of the Game, VAR protocols, tournament registration regulations, and disciplinary guidelines.",
    capabilities: ["IFAB Law Interpretation", "VAR Directives", "Disciplinary Rules", "Squad Registration"],
  },
];

/**
 * Step 1: Decomposes user query into tasks and assigns to specialized agents.
 */
async function decomposeQuery(query, history = []) {
  const prompt = `You are Football Copilot's Lead Orchestrator (Director of Football).
Analyze the following football query and determine which specialized backroom agents should investigate this inquiry.

Available Specialists:
1. "tactical_analyst": Formations, build-up shapes, pressing triggers, transitional play, substitutions.
2. "chief_scout": Player scouting, statistical profiling, market values, talent shortlists, wage/contract feasibility.
3. "opposition_analyst": Opponent form, specific rival club tactics, injury reports, match history.
4. "ifab_specialist": Laws of the Game, refereeing decisions, tournament rules, disciplinary guidelines.

Rules:
- Select between 1 and 3 of the most relevant specialists.
- For each selected specialist, provide a focused sub-task prompt telling them exactly what domain questions to answer.

User Query: "${query}"

Return JSON matching this schema:
{
  "selectedAgentIds": ["tactical_analyst", "chief_scout"],
  "tasks": [
    {
      "agentId": "tactical_analyst",
      "subPrompt": "Specific instructions for the tactical analyst..."
    }
  ],
  "reasoning": "Brief explanation of why these specialists were chosen"
}`;

  try {
    const response = await generateContentWithFallback(aiClient, {
      model: DEFAULT_LITE_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    if (response && response.text) {
      const parsed = JSON.parse(response.text);
      if (Array.isArray(parsed.tasks) && parsed.tasks.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    logger.warn(`[MultiAgentService] Query decomposition fallback: ${err.message}`);
  }

  // Safe fallback if decomposition LLM call fails
  return {
    selectedAgentIds: ["tactical_analyst", "chief_scout"],
    tasks: [
      {
        agentId: "tactical_analyst",
        subPrompt: `Analyze the tactical aspects of: "${query}"`,
      },
      {
        agentId: "chief_scout",
        subPrompt: `Analyze the player and scouting aspects of: "${query}"`,
      },
    ],
    reasoning: "Standard dual-specialist consultation.",
  };
}

/**
 * Step 2: Executes an individual specialist agent with custom tools and personas.
 */
async function executeAgentTask(task, userContext = {}) {
  const agentMeta = AGENTS_REGISTRY.find((a) => a.id === task.agentId) || {
    id: task.agentId,
    name: "Specialist",
    title: "Football Expert",
    avatar: "⚽",
  };

  let systemInstruction = "";
  let additionalContext = "";

  switch (task.agentId) {
    case "tactical_analyst":
      systemInstruction = `You are Football Copilot's Chief Tactical Analyst.
You deliver rigorous, expert-level tactical breakdowns using modern positional play terminology (half-spaces, rest-defense, pressing triggers, build-up shapes, transitional restructures). Provide sharp bullet points and actionable coaching insights.`;
      break;

    case "chief_scout":
      systemInstruction = `You are Football Copilot's Head of Recruitment & Chief Scout.
You specialize in player talent evaluation, statistical percentile comparisons, progressive metrics, market values, and squad suitability. Structure your output with clear player profiles, pros/cons, and valuation feasibility.`;
      break;

    case "opposition_analyst":
      systemInstruction = `You are Football Copilot's Opposition Intelligence Analyst.
You analyze opponent strengths, weaknesses, player danger zones, and tactical vulnerabilities. Highlight specific spaces to exploit and defensive matchups to watch.`;
      // Fetch live matches/team details if relevant
      try {
        const matches = await footballService.searchMatches(task.subPrompt);
        if (matches && matches.length > 0) {
          additionalContext += `\nRecent Opposition Matches: ${JSON.stringify(matches.slice(0, 2))}`;
        }
      } catch (e) {
        // Ignore tool lookup errors in agent pipeline
      }
      break;

    case "ifab_specialist":
      systemInstruction = `You are Football Copilot's IFAB & Regulations Compliance Director.
You provide precise interpretations grounded in official IFAB Laws of the Game, VAR application protocols, disciplinary card thresholds, and competition registration rules.`;
      // Query Qdrant rules knowledge base if available
      try {
        const queryVector = await generateEmbedding(task.subPrompt);
        if (queryVector && queryVector.length > 0) {
          const chunks = await qdrantService.searchChunks({
            queryVector,
            category: "rules",
            limit: 2,
            scoreThreshold: 0.35,
          });
          if (chunks && chunks.length > 0) {
            additionalContext += `\nOfficial Rule Documents: ${chunks.map((c) => c.content).join("\n")}`;
          }
        }
      } catch (e) {
        // Ignore vector search error
      }
      break;

    default:
      systemInstruction = `You are a specialized football analyst providing professional insights.`;
  }

  const fullPrompt = `${task.subPrompt}

${additionalContext ? `Contextual Data:\n${additionalContext}` : ""}
${userContext.memoryPromptBlock ? `\nUser Tactical Preferences:\n${userContext.memoryPromptBlock}` : ""}`;

  try {
    const response = await generateContentWithFallback(aiClient, {
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      config: {
        systemInstruction,
        temperature: 0.35,
        maxOutputTokens: 600,
      },
    });

    return {
      agentId: task.agentId,
      agentName: agentMeta.name,
      agentTitle: agentMeta.title,
      avatar: agentMeta.avatar,
      color: agentMeta.color,
      status: "completed",
      findings: response?.text || "Analysis completed.",
    };
  } catch (error) {
    logger.warn(`[MultiAgentService] Agent '${task.agentId}' execution failed: ${error.message}`);
    return {
      agentId: task.agentId,
      agentName: agentMeta.name,
      agentTitle: agentMeta.title,
      avatar: agentMeta.avatar,
      color: agentMeta.color,
      status: "error",
      findings: `Consultation temporarily unavailable: ${error.message}`,
    };
  }
}

/**
 * Step 3: Master synthesis combining all specialist outputs into a unified executive dossier.
 */
async function synthesizeCollaborativeReport(query, agentReports, userContext = {}) {
  const reportsContext = agentReports
    .map(
      (r) =>
        `### [${r.avatar} ${r.agentName} - ${r.agentTitle}]\n${r.findings}`
    )
    .join("\n\n");

  const prompt = `User Objective: "${query}"

Below are the specialized findings from our backroom staff:

${reportsContext}

${userContext.memoryPromptBlock ? `User Preferences Context:\n${userContext.memoryPromptBlock}\n` : ""}

Task:
As the Director of Football (Lead Orchestrator), synthesize these specialist reports into a cohesive, professional Executive Master Report.
- Synthesize the tactical, scouting, and match intelligence into clear, actionable conclusions.
- Highlight any strategic consensus or key takeaways.
- Format with clean Markdown headers (e.g. ### 📋 Executive Summary, ### 🎯 Tactical Strategy, ### 🔍 Recruitment & Scouting Findings, ### 🔑 Action Plan).`;

  const response = await generateContentWithFallback(aiClient, {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction:
        "You are Football Copilot's Lead Orchestrator & Director of Football. You deliver concise, elite-level football intelligence dossiers synthesizing multi-agent expertise.",
      temperature: 0.4,
      maxOutputTokens: 1000,
    },
  });

  return response?.text || "Master synthesis completed.";
}

/**
 * Main Collaborative Pipeline: Decompose -> Parallel Execute -> Synthesize
 */
async function runMultiAgentCollaboration(userId, { query, history = [], requestedAgents = [] }) {
  if (!query || !query.trim()) {
    throw new Error("Query prompt is required for multi-agent collaboration.");
  }

  const startTime = Date.now();
  logger.info(`[MultiAgentService] Starting collaboration for user '${userId}': "${query}"`);

  // 1. Gather user preferences from Memory
  let userContext = { memoryPromptBlock: "", recalledMemories: [] };
  if (userId) {
    try {
      userContext = await memoryService.recallUserContext(userId, query.trim(), { maxFacts: 3 });
    } catch (memErr) {
      logger.warn(`[MultiAgentService] Memory recall skipped: ${memErr.message}`);
    }
  }

  // 2. Decompose query into sub-tasks (or use user-requested agent list)
  let decomposition;
  if (Array.isArray(requestedAgents) && requestedAgents.length > 0) {
    decomposition = {
      selectedAgentIds: requestedAgents,
      tasks: requestedAgents.map((id) => ({
        agentId: id,
        subPrompt: `Analyze "${query}" through your specialized domain lens.`,
      })),
      reasoning: "User selected specific backroom staff members.",
    };
  } else {
    decomposition = await decomposeQuery(query.trim(), history);
  }

  // 3. Execute all specialist agents concurrently
  const agentReports = await Promise.all(
    decomposition.tasks.map((task) => executeAgentTask(task, userContext))
  );

  // 4. Synthesize unified master dossier
  const masterReport = await synthesizeCollaborativeReport(query.trim(), agentReports, userContext);

  const durationMs = Date.now() - startTime;
  logger.info(`[MultiAgentService] Collaboration finished in ${durationMs}ms with ${agentReports.length} agents.`);

  return {
    query: query.trim(),
    masterReport,
    agentsInvolved: agentReports,
    reasoning: decomposition.reasoning,
    recalledMemories: userContext.recalledMemories || [],
    durationMs,
  };
}

/**
 * Direct 1-on-1 Chat with a specific Specialist persona.
 */
async function directSpecialistChat(agentId, prompt, history = [], userId = null) {
  const agentMeta = AGENTS_REGISTRY.find((a) => a.id === agentId);
  if (!agentMeta) {
    throw new Error(`Specialist agent '${agentId}' does not exist.`);
  }

  let userContext = { memoryPromptBlock: "" };
  if (userId) {
    try {
      userContext = await memoryService.recallUserContext(userId, prompt.trim(), { maxFacts: 3 });
    } catch (e) {}
  }

  const singleTask = {
    agentId,
    subPrompt: prompt,
  };

  const report = await executeAgentTask(singleTask, userContext);

  return {
    agentId: agentMeta.id,
    agentName: agentMeta.name,
    agentTitle: agentMeta.title,
    avatar: agentMeta.avatar,
    color: agentMeta.color,
    response: report.findings,
  };
}

module.exports = {
  AGENTS_REGISTRY,
  runMultiAgentCollaboration,
  directSpecialistChat,
};
