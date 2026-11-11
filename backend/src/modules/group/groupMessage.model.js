import mongoose from "mongoose";
import Group from "./group.model.js";
import User from "../user/user.model.js";

const groupMessageSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Group,
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },

    deliveredTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
      },
    ],

    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
      },
    ],

    deliveredAt: {
      type: Date,
      default: null,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const GroupMessage = mongoose.model(
  "GroupMessage",
  groupMessageSchema
);

export default GroupMessage;
