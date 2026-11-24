import mongoose from "mongoose";
import Group from "./group.model.js";
import User from "../user/user.model.js";

const attachmentSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    resourceType: {
      type: String,
      enum: ["image", "video", "raw"],
      required: true,
    },
  },
  { _id: false }
);


const callSchema = new mongoose.Schema(
  {
    callType: {
      type: String,
      enum: ["audio", "video"],
      required: true,
    },
    status: {
      type: String,
      enum: ["completed", "missed", "rejected", "cancelled"],
      required: true,
    },
    duration: {
      type: Number,
      default: 0,
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User,
      required: true,
    },
    participantIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
      },
    ],
    startedAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);


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
      default: "",
    },
    messageType: {
      type: String,
      enum: ["text", "call"],
      default: "text",
    },
    call: {
      type: callSchema,
      default: undefined,
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
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

    // Message sabhi group members ke liye delete hua ya nahi
    isDeleted: {
      type: Boolean,
      default: false,
    },

    // Jin members ke liye message hide hua
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
      },
    ],

    // Message delete hone ka time
    deletedAt: {
      type: Date,
      default: null,
    },

     // Message edit hua ya nahi
    isEdited: {
      type: Boolean,
      default: false,
    },

    // Message edit hone ka time
    editedAt: {
      type: Date,
      default: null,
    },

    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroupMessage",
      default: null,
    },

    isForwarded: {
      type: Boolean,
      default: false,
    },

  },
  { timestamps: true }
);

const GroupMessage = mongoose.model(
  "GroupMessage",
  groupMessageSchema
);

export default GroupMessage;
