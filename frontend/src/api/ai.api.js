import axiosInstance from "./axios";
import endpoints from "./endpoints";

/**
 * Send chat prompt and conversation history to Gemini AI backend
 * @param {Object} params
 * @param {string} params.prompt - User message string
 * @param {Array} [params.history] - Array of previous chat messages [{ sender, text }]
 * @returns {Promise<Object>} API response object
 */
export const sendAiChatApi = async ({ prompt, history = [] }) => {
  const response = await axiosInstance.post(endpoints.ai.chat, {
    prompt,
    history,
  });
  return response.data;
};

export const getAiRecommendationsApi = async () => {
  try {
    const response = await axiosInstance.get(endpoints.ai.recommendations);
    return response?.data?.data || null;
  } catch (error) {
    throw error?.errors?.[0] || error;
  }
};

