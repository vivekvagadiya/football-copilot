const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    itemType: {
      type: String,
      enum: ["TEAM", "PLAYER", "MATCH", "LEAGUE"],
      required: true,
    },
    externalId: {
      type: String,
      required: true,
    },
    meta: {
      name: { type: String, required: true },
      badgeUrl: { type: String, default: "" },
      subtitle: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate favorites for the same item per user
favoriteSchema.index({ user: 1, itemType: 1, externalId: 1 }, { unique: true });

module.exports = mongoose.model("Favorite", favoriteSchema);
