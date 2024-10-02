const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    groupTitle:{
        type: String,
    },
    members: {
      type: Array,
    },
    lastMessage: {
      type: String,
    },
    lastMessageId: {
      type: String,
    },
  },
  { timestamps: true }
);
const conversationModal = mongoose.model("Conversation", conversationSchema);
module.exports = conversationModal
