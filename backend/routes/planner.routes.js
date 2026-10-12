const express = require("express");
const router = express.Router();
const plannerController = require("../controller/planner.controller");
const authenticate = require("../middleware/auth.middleware");

// Public preset templates
router.get("/templates", plannerController.getTemplatesController);

// All user-specific planner endpoints require user authentication
router.use(authenticate);

// Plan Generation & List
router.post("/generate", plannerController.createPlanController);
router.get("/", plannerController.getUserPlansController);
router.get("/:id", plannerController.getPlanByIdController);

// Plan Updates & Checklist
router.patch("/:id/checklist", plannerController.toggleChecklistController);
router.patch("/:id/status", plannerController.updatePlanStatusController);
router.delete("/:id", plannerController.deletePlanController);

module.exports = router;
