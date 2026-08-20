const { GoogleGenAI } = require("@google/genai");
const logger = require("../config/logger");

const apiKey = process.env.GEMINI_API_KEY;

let aiClient = null;
if (apiKey) {
  aiClient = new GoogleGenAI({ apiKey });
} else {
  logger.warn("GEMINI_API_KEY is not configured in backend .env");
}

/**
 * Registry of all tools available to the AI model.
 * Each tool defines both its schema (for Gemini) and its execution handler (for the backend).
 * This acts as the single source of truth for all tools.
 */
const toolsRegistry = [
  {
    schema: {
      name: "getLiveMatches",
      description:
        "Fetch live matches happening right now with scores, teams, and elapsed time.",
      parameters: { type: "OBJECT", properties: {} },
    },
    handler: async () => {
      const footballService = require("./football.service");
      return await footballService.getLiveMatches();
    },
  },
  {
    schema: {
      name: "getStanding",
      description: "Fetch league standings/table for a specific competition.",
      parameters: {
        type: "OBJECT",
        properties: {
          leagueCode: {
            type: "STRING",
            description:
              "The code of the league (PL for Premier League, PD for La Liga, SA for Serie A, BL1 for Bundesliga, FL1 for Ligue 1, CL for Champions League).",
          },
        },
        required: ["leagueCode"],
      },
    },
    handler: async (args) => {
      const footballService = require("./football.service");
      return await footballService.getStanding(args.leagueCode);
    },
  },
  {
    schema: {
      name: "searchPlayers",
      description:
        "Search for football players by name to find their ID and details.",
      parameters: {
        type: "OBJECT",
        properties: {
          query: {
            type: "STRING",
            description: "The search query (e.g. Messi, Haaland).",
          },
        },
        required: ["query"],
      },
    },
    handler: async (args) => {
      const footballService = require("./football.service");
      return await footballService.searchPlayers(args.query);
    },
  },
  {
    schema: {
      name: "searchLeagues",
      description:
        "Search for football leagues/competitions by name to find their ID and details.",
      parameters: {
        type: "OBJECT",
        properties: {
          query: {
            type: "STRING",
            description: "The search query (e.g. Premier League, La Liga).",
          },
        },
        required: ["query"],
      },
    },
    handler: async (args) => {
      const footballService = require("./football.service");
      return await footballService.searchLeagues(args.query);
    },
  },
  {
    schema: {
      name: "searchTeams",
      description:
        "Search for football teams/clubs by name to find their ID and details.",
      parameters: {
        type: "OBJECT",
        properties: {
          query: {
            type: "STRING",
            description: "The search query (e.g. Chelsea, Real Madrid).",
          },
        },
        required: ["query"],
      },
    },
    handler: async (args) => {
      const footballService = require("./football.service");
      return await footballService.searchTeams(args.query);
    },
  },
  {
    schema: {
      name: "searchMatches",
      description:
        "Search for football matches by team names or competition name to find matching scheduled, live, or finished matches.",
      parameters: {
        type: "OBJECT",
        properties: {
          query: {
            type: "STRING",
            description:
              "The search query (e.g. Arsenal vs Chelsea, Barcelona).",
          },
        },
        required: ["query"],
      },
    },
    handler: async (args) => {
      const footballService = require("./football.service");
      return await footballService.searchMatches(args.query);
    },
  },
];

// Generate the configuration array expected by the Gemini API
const footballTools = [
  {
    functionDeclarations: toolsRegistry.map((tool) => tool.schema),
  },
];

// Map function names to their executable handlers for O(1) dispatcher lookups
const toolHandlers = toolsRegistry.reduce((map, tool) => {
  map[tool.schema.name] = tool.handler;
  return map;
}, {});

const SYSTEM_INSTRUCTION = `You are Football Copilot, an elite AI sports analyst, tactical advisor, and football intelligence system.
Your job is to provide clear, insightful, accurate, and structured responses regarding football matches, tactical setups, player statistics, team standings, transfers, and scouting.

Rules:
1. Always maintain a professional, knowledgeable, and engaging sports analyst tone.
2. Structure long answers clearly using Markdown (bullet points, bold text, headers, clean formatting).
3. If asked about non-football topics, politely redirect the conversation back to football and sports analytics.
4. Provide objective, statistically sound analysis whenever discussing tactical comparisons or player scouting.`;

/**
 * Executes a list of function calls requested by the AI model in parallel.
 *
 * @param {Array<Object>} functionCalls - The function calls requested by Gemini
 * @returns {Promise<Array<Object>>} The results formatted as tool response parts
 */
const executeToolCalls = async (functionCalls) => {
  const promises = functionCalls.map(async (call) => {
    const { name: functionName, args: functionArgs } = call;
    const handler = toolHandlers[functionName];

    if (!handler) {
      logger.warn(
        `[Tool Calling] Tool '${functionName}' requested by AI is not registered.`,
      );
      return {
        functionResponse: {
          name: functionName,
          response: { error: `Tool '${functionName}' is not registered.` },
        },
      };
    }

    try {
      logger.info(
        `[Tool Calling] Executing tool '${functionName}' in parallel with args:`,
        functionArgs,
      );
      const executionResult = await handler(functionArgs);
      logger.info(
        `[Tool Calling] Tool '${functionName}' executed successfully.`,
      );

      return {
        functionResponse: {
          name: functionName,
          response: { result: executionResult },
        },
      };
    } catch (execErr) {
      logger.error(
        `[Tool Calling] Error executing tool '${functionName}':`,
        execErr,
      );
      return {
        functionResponse: {
          name: functionName,
          response: { error: execErr.message || "Failed execution" },
        },
      };
    }
  });

  return await Promise.all(promises);
};

/**
 * Generate a chat response using Google Gemini
 * @param {string} prompt - Current user message
 * @param {Array<{sender: string, text: string}>} history - Previous messages in chat thread
 * @returns {Promise<string>} AI response text
 */
const generateChatResponse = async (prompt, history = []) => {
  if (!aiClient) {
    throw new Error("Gemini API key is missing in server environment.");
  }

  // 1. Format history for the Gemini API (user / model roles)
  const contents = [];
  if (Array.isArray(history) && history.length > 0) {
    history.forEach((msg) => {
      if (!msg.text) return;
      const role = msg.sender === "user" ? "user" : "model";
      contents.push({
        role,
        parts: [{ text: msg.text }],
      });
    });
  }

  // 2. Append current user prompt
  contents.push({
    role: "user",
    parts: [{ text: prompt }],
  });

  const envModel = process.env.GEMINI_MODEL;
  const selectedModel = envModel ? envModel : "gemini-2.0-flash";

  try {
    let loopCount = 0;
    const MAX_LOOPS = 5; // Guard against infinite tool-calling loops

    while (loopCount < MAX_LOOPS) {
      // Send message to Gemini with registered tools
      const response = await aiClient.models.generateContent({
        model: selectedModel,
        contents: contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: footballTools,
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      });

      // CASE A: No tool call requested. This is the final text answer from Gemini.
      if (!response.functionCalls || response.functionCalls.length === 0) {
        if (response && response.text) {
          return response.text;
        }
        throw new Error("No text response returned from Gemini API.");
      }

      // CASE B: Gemini requested one or more tool calls.
      logger.info(
        `[Tool Calling] Gemini requested tool execution: ${JSON.stringify(response.functionCalls)}`,
      );

      // A) Save the model's call request to history so the conversation remains coherent
      contents.push({
        role: "model",
        parts: response.candidates[0].content.parts,
      });

      // B) Execute each requested tool using the executor runner
      const toolResponseParts = await executeToolCalls(response.functionCalls);

      // C) Send the tool execution output back to Gemini's context
      contents.push({
        role: "user",
        parts: toolResponseParts,
      });

      loopCount++;
    }

    throw new Error(
      "Max tool calling loop threshold exceeded without a text response.",
    );
  } catch (error) {
    logger.error("Error generating Gemini response with tools:", error);
    throw error;
  }
};

/**
 * Generate a structured match summary using Gemini AI
 * @param {Object} matchData - Raw match details, events, statistics, lineups
 * @returns {Promise<string>} AI response text in Markdown
 */
const generateMatchSummaryResponse = async (matchData) => {
  if (!aiClient) {
    throw new Error("Gemini API key is missing in server environment.");
  }

  const prompt = `Generate a comprehensive match summary based on the following match details. 
Provide a detailed tactical analysis, list key turning points (like goals, substitutions, cards), and discuss standout performers.
Format the output elegantly using clean Markdown with distinct headers.
Match Details:
${JSON.stringify(matchData, null, 2)}`;

  const envModel = process.env.GEMINI_MODEL;
  const selectedModel = envModel ? envModel : "gemini-2.0-flash";

  try {
    const response = await aiClient.models.generateContent({
      model: selectedModel,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction:
          "You are an elite football sports writer and tactical analyst. Generate a structured match summary in markdown format with clear, engaging, and professional headers (e.g. ### ⚡ Match Analysis, ### 🔑 Turning Points, ### 🏆 Standout Performers). Keep bullet points concise and stats accurate.",
        temperature: 0.6,
        maxOutputTokens: 500,
      },
    });

    if (response && response.text) {
      return response.text;
    }

    throw new Error("No text response returned from Gemini API.");
  } catch (error) {
    logger.error("Error generating Gemini match summary:", error);
    throw error;
  }
};

/**
 * Generate a structured AI news summary using Gemini AI
 * @param {Object} newsItem - Raw news item with title, content, and source
 * @returns {Promise<string>} AI response text in Markdown
 */
const generateNewsSummaryResponse = async (newsItem) => {
  if (!aiClient) {
    throw new Error("Gemini API key is missing in server environment.");
  }

  const prompt = `Generate a concise, insightful, and structured AI summary/briefing of the following football news article.
Provide:
1. A quick "Key Takeaway" or TL;DR section.
2. A bulleted list of the main points/arguments.
3. The "Tactical/Strategic Context" or "Future Outlook & Implications" of this news.
Format the output elegantly using clean Markdown with distinct headers.
News Article:
Title: ${newsItem.title}
Content: ${newsItem.content}
Source: ${newsItem.sourceStr || "Unknown Source"}`;

  const envModel = process.env.GEMINI_MODEL;
  const selectedModel = envModel ? envModel : "gemini-2.0-flash";

  try {
    const response = await aiClient.models.generateContent({
      model: selectedModel,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction:
          "You are an elite football sports writer and tactical analyst. Generate a structured AI news summary in markdown format with clear, engaging, and professional headers (e.g. ### ⚡ Executive Summary, ### 📌 Key Bullet Points, ### 🔮 Future Outlook & Implications). Keep bullet points concise and details accurate.",
        temperature: 0.6,
        maxOutputTokens: 500,
      },
    });

    if (response && response.text) {
      return response.text;
    }

    throw new Error("No text response returned from Gemini API.");
  } catch (error) {
    logger.error("Error generating Gemini news summary:", error);
    throw error;
  }
};

/**
 * Generate structured recommendations using Gemini AI
 * @param {Array} favorites - User favorites list
 * @param {Array} matches - Live/upcoming matches list
 * @param {Array} news - News items list
 * @returns {Promise<Object>} AI reasoned recommendation object
 */
const generateRecommendationsResponse = async (favorites, matches, news) => {
  if (!aiClient) {
    throw new Error("Gemini API key is missing in server environment.");
  }

  const prompt = `Generate a personalized football briefing and recommendation set based on the user's favorites and the current football context.
  
User's Favorites:
${JSON.stringify(favorites, null, 2)}

Current Live/Upcoming Matches:
${JSON.stringify(matches, null, 2)}

Recent News:
${JSON.stringify(news, null, 2)}

You must return a structured JSON response matching this schema:
{
  "briefing": "A concise, engaging 1-2 sentence dashboard briefing text updating them on their favorites or high-stakes matches today. Avoid generic text.",
  "recommendedMatches": [
    {
      "matchId": "string (the match id from the matches list)",
      "reason": "Clear explanation of why they should watch this match, referencing their favorite team, league, players, or general excitement/significance.",
      "excitementRating": number (rating from 1 to 10)
    }
  ],
  "scoutingReport": {
    "targetTeam": "string (one of user's favorite teams, or if none, a default high-profile team like Chelsea, Real Madrid, Arsenal)",
    "playerName": "string (a recommended player to sign or watch)",
    "position": "string (player's position)",
    "marketValue": "string (estimated value, e.g. €50M)",
    "fitReasoning": "A detailed 1-2 sentence tactical justification of why this player fits the targetTeam's style of play or squad needs."
  },
  "suggestedPrompts": [
    "A string prompt the user could ask Football Copilot related to these recommendations, e.g., 'Tell me more about [PlayerName]'s tactical fit at [Team]'"
  ]
}`;

  const envModel = process.env.GEMINI_MODEL;
  const selectedModel = envModel ? envModel : "gemini-2.0-flash";

  try {
    const response = await aiClient.models.generateContent({
      model: selectedModel,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction:
          "You are an elite football director, scout, and tactical analyst. You generate personalized recommendations and briefings. You must respond ONLY with a valid JSON object matching the requested schema.",
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    });

    if (response && response.text) {
      return JSON.parse(response.text);
    }

    throw new Error("No text response returned from Gemini API.");
  } catch (error) {
    logger.error("Error generating Gemini recommendations:", error);
    throw error;
  }
};

/**
 * Generate structured intelligent notifications using Gemini AI
 * @param {Array} favorites - User favorites list
 * @param {Array} matches - Live/upcoming matches list
 * @param {Array} news - News items list
 * @returns {Promise<Array<Object>>} List of generated notification objects
 */
const generateNotificationsResponse = async (favorites, matches, news) => {
  if (!aiClient) {
    throw new Error("Gemini API key is missing in server environment.");
  }

  const prompt = `Evaluate the user's favorites and current live/upcoming matches and news, and generate 2-4 high-value intelligent notifications for the user's feed.

User's Favorites:
${JSON.stringify(favorites, null, 2)}

Live & Upcoming Matches:
${JSON.stringify(matches, null, 2)}

Recent News:
${JSON.stringify(news, null, 2)}

You must return a structured JSON object containing an array of notifications:
{
  "notifications": [
    {
      "title": "Short title (e.g., 'Tactical Alert: Arsenal Setup' or 'Transfer Intel: Zubimendi')",
      "message": "1-2 sentence concise summary highlighting key tactical angles, match momentum, or transfer news.",
      "type": "one of: tactical, match, transfer, system, recommendation",
      "priority": "one of: low, medium, high",
      "meta": {
        "matchId": "optional string match id",
        "team": "optional string team name",
        "player": "optional string player name"
      }
    }
  ]
}`;

  const envModel = process.env.GEMINI_MODEL;
  const selectedModel = envModel ? envModel : "gemini-2.0-flash";

  try {
    const response = await aiClient.models.generateContent({
      model: selectedModel,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction:
          "You are Football Copilot's intelligent broadcast monitor. You generate actionable, high-priority notifications tailored to user favorite teams and players. You must respond ONLY with a valid JSON object matching the requested schema.",
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    });

    if (response && response.text) {
      const parsed = JSON.parse(response.text);
      return parsed.notifications || [];
    }

    throw new Error("No text response returned from Gemini API.");
  } catch (error) {
    logger.error("Error generating Gemini notifications:", error);
    throw error;
  }
};

module.exports = {
  generateChatResponse,
  generateMatchSummaryResponse,
  generateNewsSummaryResponse,
  generateRecommendationsResponse,
  generateNotificationsResponse,
  footballTools,
};
