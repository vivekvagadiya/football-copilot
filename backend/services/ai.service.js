const { GoogleGenAI } = require("@google/genai");
const logger = require("../config/logger");

const apiKey = process.env.GEMINI_API_KEY;

let aiClient = null;
if (apiKey) {
  aiClient = new GoogleGenAI({ apiKey });
} else {
  logger.warn("GEMINI_API_KEY is not configured in backend .env");
}

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

  // Format history for Gemini API standard (user / model roles)
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

  // Append current user prompt
  contents.push({
    role: "user",
    parts: [{ text: prompt }],
  });

  // Ensure model name is valid (gemini-2.0-flash or gemini-1.5-flash)
  const envModel = process.env.GEMINI_MODEL;
  const selectedModel = envModel ? envModel : "gemini-2.0-flash";
  console.log(selectedModel, envModel, "selected model");

  try {
    const response = await aiClient.models.generateContent({
      model: selectedModel,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        maxOutputTokens: 700, // High token limit so responses don't cut off mid-sentence
      },
    });

    if (response && response.text) {
      return response.text;
    }

    throw new Error("No text response returned from Gemini API.");
  } catch (error) {
    logger.error("Error generating Gemini chat response:", error);

    const errString =
      typeof error === "string"
        ? error
        : error.message || JSON.stringify(error);

    // Handle 429 Rate Limit / Quota Exceeded cleanly
    if (
      error.status === 429 ||
      errString.includes("429") ||
      errString.includes("RESOURCE_EXHAUSTED") ||
      errString.includes("Quota exceeded")
    ) {
      const customError = new Error(
        "Gemini API rate limit or quota exceeded. Please wait a few seconds and try again.",
      );
      customError.statusCode = 429;
      throw customError;
    }

    // Handle 404 / Model not found with fallback
    if (
      error.status === 404 ||
      errString.includes("NOT_FOUND") ||
      errString.includes("not found") ||
      errString.includes("no longer available")
    ) {
      try {
        logger.info("Attempting fallback to gemini-1.5-flash...");
        const fallbackResponse = await aiClient.models.generateContent({
          model: "gemini-1.5-flash",
          contents: contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        });
        if (fallbackResponse && fallbackResponse.text) {
          return fallbackResponse.text;
        }
      } catch (fallbackErr) {
        logger.error("Fallback to gemini-1.5-flash also failed:", fallbackErr);
      }
    }

    // Parse stringified JSON error messages if present
    let userFriendlyMessage =
      "Failed to communicate with AI service. Please try again.";
    try {
      if (typeof error.message === "string" && error.message.startsWith("{")) {
        const parsed = JSON.parse(error.message);
        if (parsed?.error?.message) {
          userFriendlyMessage = parsed.error.message;
        }
      }
    } catch (_) {}

    const finalErr = new Error(userFriendlyMessage);
    finalErr.statusCode = error.status || 500;
    throw finalErr;
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
        systemInstruction: "You are an elite football sports writer and tactical analyst. Generate a structured match summary in markdown format with clear, engaging, and professional headers (e.g. ### ⚡ Match Analysis, ### 🔑 Turning Points, ### 🏆 Standout Performers). Keep bullet points concise and stats accurate.",
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
        systemInstruction: "You are an elite football sports writer and tactical analyst. Generate a structured AI news summary in markdown format with clear, engaging, and professional headers (e.g. ### ⚡ Executive Summary, ### 📌 Key Bullet Points, ### 🔮 Future Outlook & Implications). Keep bullet points concise and details accurate.",
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

module.exports = {
  generateChatResponse,
  generateMatchSummaryResponse,
  generateNewsSummaryResponse,
};
