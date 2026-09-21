import axiosInstance from "./axios";
import endpoints from "./endpoints";

/**
 * Fetch the backroom staff agents registry with metadata, roles, and avatars
 */
export const getAgentsRegistryApi = async () => {
  const response = await axiosInstance.get(endpoints.agents.registry);
  return response?.data?.data || [];
};

/**
 * Run a multi-agent collaborative session on a complex query
 * @param {Object} payload
 * @param {string} payload.query - User objective/question
 * @param {Array} [payload.history] - Conversation history
 * @param {Array<string>} [payload.requestedAgents] - Optional specific agent IDs
 */
export const runMultiAgentCollaborationApi = async ({ query, history = [], requestedAgents = [] }) => {
  const response = await axiosInstance.post(endpoints.agents.collaborate, {
    query,
    history,
    requestedAgents,
  });
  return response?.data?.data;
};

/**
 * Direct 1-on-1 consultation chat with a specific backroom specialist agent
 * @param {string} agentId - "tactical_analyst" | "chief_scout" | "opposition_analyst" | "ifab_specialist"
 * @param {Object} payload
 * @param {string} payload.prompt - User message
 * @param {Array} [payload.history] - History
 */
export const sendDirectAgentChatApi = async (agentId, { prompt, history = [] }) => {
  const response = await axiosInstance.post(endpoints.agents.chat(agentId), {
    prompt,
    history,
  });
  return response?.data?.data;
};
