const { GoogleGenAI } = require("@google/genai");
const logger = require("../config/logger");
const footballService = require("./football.service");
const apiKey = process.env.GEMINI_API_KEY;

let aiClient = null;
if (apiKey) {
  aiClient = new GoogleGenAI({ apiKey });
} else {
  logger.warn("GEMINI_API_KEY is not configured in backend .env");
}
const toolRegistry = {
  getLiveMatches: async () => {
    return await footballService.getLiveMatches();
  },
  getStanding: async (args) => {
    return await footballService.getStanding(args.leagueCode);
  },
  getPlayerDetails: async (args) => {
    return await footballService.getPlayerDetails(args.playerId);
  },
  searchPlayers: async (args) => {
    return await footballService.searchPlayers(args.query);
  },
};
const SYSTEM_INSTRUCTION = `You are Football Copilot, an elite AI sports analyst, tactical advisor, and football intelligence system.
Your job is to provide clear, insightful, accurate, and structured responses regarding football matches, tactical setups, player statistics, team standings, transfers, and scouting.

Rules:
1. Always maintain a professional, knowledgeable, and engaging sports analyst tone.
2. Structure long answers clearly using Markdown (bullet points, bold text, headers, clean formatting).
3. If asked about non-football topics, politely redirect the conversation back to football and sports analytics.
4. Provide objective, statistically sound analysis whenever discussing tactical comparisons or player scouting.`;

// const SYSTEM_INSTRUCTION = `
// You are Football Copilot.

// Answer only football-related questions.

// Rules:
// - Accurate, concise, and neutral.
// - Prefer short answers.
// - Expand only when requested.
// - Use Markdown for lists or tables when helpful.
// - Never fabricate facts or statistics.
// - If information is unavailable, say so.
// - Redirect unrelated questions back to football.
// `;
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
          maxOutputTokens: 1000,
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
        `Gemini requested tool execution: ${JSON.stringify(response.functionCalls)}`,
      );

      // A) Save the model's call request to history so the conversation remains coherent
      contents.push({
        role: "model",
        parts: response.candidates[0].content.parts,
      });

      // B) Execute each requested tool in parallel
      const toolResponseParts = [];
      for (const call of response.functionCalls) {
        const functionName = call.name;
        const functionArgs = call.args;

        if (toolRegistry[functionName]) {
          try {
            const executionResult =
              await toolRegistry[functionName](functionArgs);

            toolResponseParts.push({
              functionResponse: {
                name: functionName,
                response: { result: executionResult },
              },
            });
          } catch (execErr) {
            logger.error(`Error executing tool ${functionName}:`, execErr);
            toolResponseParts.push({
              functionResponse: {
                name: functionName,
                response: { error: execErr.message || "Failed execution" },
              },
            });
          }
        } else {
          toolResponseParts.push({
            functionResponse: {
              name: functionName,
              response: { error: `Tool ${functionName} is not registered.` },
            },
          });
        }
      }

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
        maxOutputTokens: 1200,
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
        maxOutputTokens: 1000,
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

// Add this to your ai.service.js file
const footballTools = [
  {
    functionDeclarations: [
      {
        name: "getLiveMatches",
        description:
          "Fetch live matches happening right now with scores, teams, and elapsed time.",
        parameters: { type: "OBJECT", properties: {} },
      },
      {
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
      {
        name: "getPlayerDetails",
        description:
          "Fetch details, stats, current team, and transfers for a specific player by their ID.",
        parameters: {
          type: "OBJECT",
          properties: {
            playerId: { type: "STRING", description: "The unique player ID." },
          },
          required: ["playerId"],
        },
      },
      {
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
    ],
  },
];

module.exports = {
  generateChatResponse,
  generateMatchSummaryResponse,
  generateNewsSummaryResponse,
  footballTools,
};
