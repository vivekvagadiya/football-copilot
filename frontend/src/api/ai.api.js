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

/**
 * List all saved AI conversations for the user from MongoDB
 */
export const getAiConversationsApi = async () => {
  try {
    const url = endpoints?.ai?.conversations || "/ai/conversations";
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

/**
 * Fetch a single AI conversation by ID with full messages history
 */
export const getAiConversationByIdApi = async (id) => {
  try {
    const url =
      typeof endpoints?.ai?.conversationById === "function"
        ? endpoints.ai.conversationById(id)
        : `/ai/conversations/${id}`;
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

/**
 * Create a new AI conversation session in MongoDB
 */
export const createAiConversationApi = async (data = {}) => {
  try {
    const url = endpoints?.ai?.conversations || "/ai/conversations";
    const response = await axiosInstance.post(url, data);
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

/**
 * Send user message to conversation: executes AI/RAG and persists turns
 */
export const sendMessageToAiConversationApi = async (id, { prompt, isRag = true, category }) => {
  try {
    const url =
      typeof endpoints?.ai?.conversationMessages === "function"
        ? endpoints.ai.conversationMessages(id)
        : `/ai/conversations/${id}/messages`;
    const response = await axiosInstance.post(url, {
      prompt,
      isRag,
      category,
    });
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

/**
 * Update conversation (rename title or toggle pinned)
 */
export const updateAiConversationApi = async (id, data) => {
  try {
    const url =
      typeof endpoints?.ai?.conversationById === "function"
        ? endpoints.ai.conversationById(id)
        : `/ai/conversations/${id}`;
    const response = await axiosInstance.patch(url, data);
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

/**
 * Delete a specific AI conversation from MongoDB
 */
export const deleteAiConversationApi = async (id) => {
  try {
    const url =
      typeof endpoints?.ai?.conversationById === "function"
        ? endpoints.ai.conversationById(id)
        : `/ai/conversations/${id}`;
    const response = await axiosInstance.delete(url);
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

/**
 * Delete all AI conversations for the logged-in user
 */
export const clearAllAiConversationsApi = async () => {
  try {
    const url = endpoints?.ai?.conversations || "/ai/conversations";
    const response = await axiosInstance.delete(url);
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};


