const mongoose = require("mongoose");
const { Schema } = mongoose;

const chatMemberSchema = new Schema({
  chatId: {
    type: Schema.Types.ObjectId,
    ref: "Chat",
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  lastReadMessage: {
    type: Schema.Types.ObjectId,
    ref: "Message",
    // required: true,
  },
  lastReadAt: {
    type: Date,
    default: null,
  },
  pinned: {
    type: Boolean,
    default: false,
  },
  favorite: {
    type: Boolean,
    default: false,
  },
});

chatMemberSchema.index({
  chatId: 1,
  userId: 1,
});
chatMemberSchema.index({
  userId: 1,
});
module.exports = mongoose.model("ChatMember", chatMemberSchema);
