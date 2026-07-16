const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chatSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
    },
    name: {
      type: String,
      trim: true,
      minlength: 3,
      maxlength: 50,
      // Name is required only for group chats
      required: function () {
        return this.type === "group";
      },
    },
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      required: true,
    },
    admins: [{ type: Schema.Types.ObjectId, ref: "User" }],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    groupAvatar: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Add an index on participants for faster queries to find chats for a user
chatSchema.index({ type: 1, participants: 1 });

chatSchema.pre("validate", function () {
  if (this.type === "direct" && this.participants.length !== 2) {
    throw new Error("Direct chat must contain exactly 2 participants");
  }

  if (this.type === "group" && this.isNew && this.participants.length < 3) {
    throw new Error("Group chat must contain at least 3 participants");
  }
});

module.exports = mongoose.model("Chat", chatSchema);
