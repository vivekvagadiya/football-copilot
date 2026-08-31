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

export const sendRagQueryApi = async ({
  query,
  history = [],
  category = null,
  topK = 4,
}) => {
  try {
    const url = endpoints?.ai?.ragQuery || "/ai/rag/query";
    const response = await axiosInstance.post(url, {
      query,
      history,
      category,
      topK,
    });
    return response.data; // { success, data: { answer, sources, chunks } }
  } catch (error) {
    throw error?.response?.data || error;
  }
};

/**
 * Fetch knowledge documents for search or knowledge base list
 */
export const getKnowledgeDocumentsApi = async (params = {}) => {
  try {
    const url = endpoints?.ai?.ragDocuments || "/ai/rag/documents";
    const response = await axiosInstance.get(url, {
      params,
    });
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

/**
 * Ingest a new document into the knowledge base
 */
export const ingestKnowledgeDocumentApi = async (docData) => {
  try {
    const url = endpoints?.ai?.ragIngest || "/ai/rag/ingest";
    const response = await axiosInstance.post(url, docData);
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

