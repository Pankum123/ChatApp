
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
  },
  { timestamps: true }
);

const GroupMessage = mongoose.model(
  "GroupMessage",
  groupMessageSchema
);

export default GroupMessage;
