import axiosInstance from "./axios";
import endpoints from "./endpoints";

/**
 * Fetch available planner prompt templates
 */
export const getPlannerTemplatesApi = async () => {
  const response = await axiosInstance.get(endpoints.planner.templates);
  return response?.data?.data || [];
};

/**
 * Request the AI Planner Agent to generate a comprehensive tactical masterplan
 * @param {Object} payload
 * @param {string} payload.goal - Tactical goal statement
 * @param {string} [payload.planType] - "match_preparation" | "scouting_campaign" | "tactical_drill_progression" | "custom"
 * @param {Object} [payload.opponent] - Opponent metadata { name, teamId, league, matchDate }
 */
export const generateTacticalPlanApi = async ({ goal, planType, opponent = {} }) => {
  const response = await axiosInstance.post(endpoints.planner.generate, {
    goal,
    planType,
    opponent,
  });
  return response?.data?.data;
};

/**
 * Fetch list of saved tactical plans for current user
 */
export const getUserPlansApi = async (params = {}) => {
  const response = await axiosInstance.get(endpoints.planner.plans, { params });
  return response?.data?.data || { plans: [], total: 0 };
};

/**
 * Fetch specific tactical plan details by ID
 */
export const getPlanByIdApi = async (id) => {
  const response = await axiosInstance.get(endpoints.planner.planById(id));
  return response?.data?.data;
};

/**
 * Toggle checklist item status in a tactical plan
 */
export const toggleChecklistItemApi = async (planId, { phaseId, itemId, isCompleted }) => {
  const response = await axiosInstance.patch(endpoints.planner.checklist(planId), {
    phaseId,
    itemId,
    isCompleted,
  });
  return response?.data?.data;
};

/**
 * Update plan status
 */
export const updatePlanStatusApi = async (planId, status) => {
  const response = await axiosInstance.patch(endpoints.planner.status(planId), {
    status,
  });
  return response?.data?.data;
};

/**
 * Delete a tactical plan
 */
export const deletePlanApi = async (planId) => {
  const response = await axiosInstance.delete(endpoints.planner.planById(planId));
  return response?.data;
};
