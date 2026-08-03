const asyncHandler = require("../utils/asyncHandler");
const apiResponse = require("../utils/apiResponse");
const aiService = require("../services/ai.service");

const chat = asyncHandler(async (req, res) => {
  const { prompt, history } = req.body;

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return apiResponse.error(res, "Prompt string is required", 400);
  }

  const responseText = await aiService.generateChatResponse(prompt, history || []);

  return apiResponse.success(res, "AI response generated successfully", {
    response: responseText,
  });
});

module.exports = {
  chat,
};
