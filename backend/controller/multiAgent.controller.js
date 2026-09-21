const multiAgentService = require("../services/multiAgent.service");
const apiResponse = require("../utils/apiResponse");

/**
 * Get all available backroom staff agents from the registry.
 */
exports.getAgentsRegistryController = async (req, res, next) => {
  try {
    return apiResponse.success(
      res,
      "Backroom staff registry fetched successfully",
      multiAgentService.AGENTS_REGISTRY
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Run a multi-agent collaborative session on a complex prompt.
 */
exports.collaborateController = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { query, history, requestedAgents } = req.body;

    if (!query || typeof query !== "string" || !query.trim()) {
      return apiResponse.badRequest(res, "Query prompt is required.");
    }

    const result = await multiAgentService.runMultiAgentCollaboration(userId, {
      query: query.trim(),
      history: history || [],
      requestedAgents: requestedAgents || [],
    });

    return apiResponse.success(
      res,
      "Multi-agent collaboration completed successfully",
      result
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Direct 1-on-1 consultation with a specific backroom specialist agent.
 */
exports.directChatController = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { agentId } = req.params;
    const { prompt, history } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return apiResponse.badRequest(res, "Prompt is required.");
    }

    const result = await multiAgentService.directSpecialistChat(
      agentId,
      prompt.trim(),
      history || [],
      userId
    );

    return apiResponse.success(
      res,
      `Response from ${result.agentName} generated successfully`,
      result
    );
  } catch (error) {
    next(error);
  }
};
