const plannerService = require("../services/planner.service");
const apiResponse = require("../utils/apiResponse");

/**
 * Get available planner quick-start templates.
 */
exports.getTemplatesController = async (req, res, next) => {
  try {
    return apiResponse.success(
      res,
      "Planner templates retrieved successfully",
      plannerService.PLANNER_TEMPLATES
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Generate a new tactical masterplan using AI Planner Agent.
 */
exports.createPlanController = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { goal, planType, opponent } = req.body;

    if (!goal || typeof goal !== "string" || !goal.trim()) {
      return apiResponse.badRequest(res, "Goal prompt is required.");
    }

    const plan = await plannerService.createTacticalPlan(userId, {
      goal: goal.trim(),
      planType,
      opponent,
    });

    return apiResponse.success(res, "Tactical plan generated successfully", plan, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all tactical plans for current user.
 */
exports.getUserPlansController = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { status, planType, page, limit } = req.query;

    const result = await plannerService.getUserPlans(userId, {
      status,
      planType,
      page,
      limit,
    });

    return apiResponse.success(res, "User plans retrieved successfully", result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get details of a single tactical plan.
 */
exports.getPlanByIdController = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const plan = await plannerService.getPlanById(userId, id);
    if (!plan) {
      return apiResponse.notFound(res, "Tactical plan not found.");
    }

    return apiResponse.success(res, "Tactical plan details retrieved successfully", plan);
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle checklist item completion status.
 */
exports.toggleChecklistController = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { phaseId, itemId, isCompleted } = req.body;

    if (!itemId) {
      return apiResponse.badRequest(res, "itemId is required.");
    }

    const updatedPlan = await plannerService.toggleChecklistItem(
      userId,
      id,
      phaseId,
      itemId,
      isCompleted
    );

    if (!updatedPlan) {
      return apiResponse.notFound(res, "Tactical plan or checklist item not found.");
    }

    return apiResponse.success(res, "Checklist item updated successfully", updatedPlan);
  } catch (error) {
    next(error);
  }
};

/**
 * Update plan status (draft, in_progress, completed, archived).
 */
exports.updatePlanStatusController = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return apiResponse.badRequest(res, "Status is required.");
    }

    const updatedPlan = await plannerService.updatePlanStatus(userId, id, status);
    if (!updatedPlan) {
      return apiResponse.notFound(res, "Tactical plan not found.");
    }

    return apiResponse.success(res, "Tactical plan status updated successfully", updatedPlan);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a tactical plan.
 */
exports.deletePlanController = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const success = await plannerService.deletePlan(userId, id);
    if (!success) {
      return apiResponse.notFound(res, "Tactical plan not found or already deleted.");
    }

    return apiResponse.success(res, "Tactical plan deleted successfully", { id });
  } catch (error) {
    next(error);
  }
};
