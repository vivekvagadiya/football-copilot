const mongoose = require("mongoose");

const checklistItemSchema = new mongoose.Schema({
  task: {
    type: String,
    required: true,
    trim: true,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
    default: null,
  },
});

const phaseSchema = new mongoose.Schema({
  phaseName: {
    type: String,
    required: true,
    trim: true,
  },
  objective: {
    type: String,
    trim: true,
    default: "",
  },
  tactics: {
    type: [String],
    default: [],
  },
  checklist: {
    type: [checklistItemSchema],
    default: [],
  },
});

const tacticalPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    planType: {
      type: String,
      enum: ["match_preparation", "scouting_campaign", "tactical_drill_progression", "custom"],
      default: "match_preparation",
      index: true,
    },
    opponent: {
      name: { type: String, trim: true, default: "" },
      teamId: { type: String, default: null },
      league: { type: String, default: "" },
      matchDate: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["draft", "in_progress", "completed", "archived"],
      default: "in_progress",
      index: true,
    },
    overview: {
      type: String,
      default: "",
    },
    lineupRecommendation: {
      formation: { type: String, default: "4-3-3" },
      style: { type: String, default: "" },
      startingXI: [
        {
          position: { type: String, default: "" },
          player: { type: String, default: "" },
          role: { type: String, default: "" },
          keyInstruction: { type: String, default: "" },
        },
      ],
      substitutions: [
        {
          minute: { type: String, default: "" },
          outPlayer: { type: String, default: "" },
          inPlayer: { type: String, default: "" },
          tacticalTrigger: { type: String, default: "" },
        },
      ],
    },
    phases: {
      type: [phaseSchema],
      default: [],
    },
    contingencies: [
      {
        scenario: { type: String, default: "" },
        action: { type: String, default: "" },
      },
    ],
    recalledMemories: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    sources: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    rawGoal: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

tacticalPlanSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("TacticalPlan", tacticalPlanSchema);
