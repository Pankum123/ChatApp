import { getReceiverSocketId, io } from "../../sockets/server.js";
import Conversation from "../conversation/conversation.model.js";
import Message from "./message.model.js";
import mongoose from "mongoose";
import User from "../user/user.model.js";
import Group from "../group/group.model.js";
import GroupMessage from "../group/groupMessage.model.js";


export const sendMessage = async (req, res) => {
  try {
    const { message, replyTo } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message cannot be empty",
      });
    }

    let conversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        members: [senderId, receiverId],
      });
    }

    let replyMessage = null;

    if (replyTo) {
      if (!mongoose.Types.ObjectId.isValid(replyTo)) {
        return res.status(400).json({
          error: "Invalid reply message ID",
        });
      }

      replyMessage = await Message.findOne({
        _id: replyTo,
        $or: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      });

      if (!replyMessage) {
        return res.status(404).json({
          error: "Reply message not found",
        });
      }
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      message: message.trim(),
      replyTo: replyMessage ? replyMessage._id : null,
    });

    conversation.messages.push(newMessage._id);

    await Promise.all([
      conversation.save(),
      newMessage.save(),
    ]);

    await newMessage.populate({
      path: "replyTo",
      select: "message senderId isDeleted",
    });

    const receiverSocketId = getReceiverSocketId(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const getMessage = async (req, res) => {
  try {
    const { id: chatUser } = req.params;
    const senderId = req.user._id;

    let conversation = await Conversation.findOne({
      members: { $all: [senderId, chatUser] },
    }).populate({
      path: "messages",
      populate: {
        path: "replyTo",
        select: "message senderId isDeleted",
      },
    });

    if (!conversation) {
      return res.status(201).json([]);
    }

    const messages = conversation.messages.filter((message) => {
      return !message.deletedFor.some(
        (id) => id.toString() === senderId.toString()
      );
    });

    res.status(201).json(messages);
  } catch (error) {
    console.log("Error in getMessage", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Delete message for me
export const deleteMessageForMe = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ error: "Invalid message ID" });
    }

    const message = await Message.findOne({
      _id: messageId,
      $or: [{ senderId: userId }, { receiverId: userId }],
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    await Message.updateOne(
      { _id: messageId },
      { $addToSet: { deletedFor: userId } }
    );

    res.status(200).json({
      message: "Message deleted for you",
      messageId,
    });
  } catch (error) {
    console.log("Delete message for me error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// Delete message for everyone
export const deleteMessageForEveryone = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ error: "Invalid message ID" });
    }

    const message = await Message.findOne({
      _id: messageId,
      senderId: userId,
    });

    if (!message) {
      return res.status(404).json({
        error: "Message not found or you cannot delete this message",
      });
    }

    if (message.isDeleted) {
      return res.status(400).json({ error: "Message already deleted" });
    }

    message.message = "This message was deleted";
    message.isDeleted = true;
    message.deletedAt = new Date();

    await message.save();

    const deleteData = {
      messageId: message._id.toString(),
      message: "This message was deleted",
      isDeleted: true,
      deletedAt: message.deletedAt,
    };

    const receiverSocketId = getReceiverSocketId(
      message.receiverId.toString()
    );

    const senderSocketId = getReceiverSocketId(
      message.senderId.toString()
    );

    if (receiverSocketId) {
      io.to(receiverSocketId).emit(
        "messageDeletedForEveryone",
        deleteData
      );
    }

    if (senderSocketId) {
      io.to(senderSocketId).emit(
        "messageDeletedForEveryone",
        deleteData
      );
    }

    res.status(200).json({
      message: "Message deleted for everyone",
      deletedMessage: deleteData,
    });
  } catch (error) {
    console.log("Delete message for everyone error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Edit message
export const editMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { message: newMessage } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ error: "Invalid message ID" });
    }

    if (!newMessage || !newMessage.trim()) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    const message = await Message.findOne({
      _id: messageId,
      senderId: userId,
    });

    if (!message) {
      return res.status(404).json({
        error: "Message not found or you cannot edit this message",
      });
    }

    if (message.isDeleted) {
      return res.status(400).json({
        error: "Deleted message cannot be edited",
      });
    }

    message.message = newMessage.trim();
    message.isEdited = true;
    message.editedAt = new Date();

    await message.save();

    const editData = {
      messageId: message._id.toString(),
      message: message.message,
      isEdited: message.isEdited,
      editedAt: message.editedAt,
    };

    const receiverSocketId = getReceiverSocketId(
      message.receiverId.toString()
    );

    const senderSocketId = getReceiverSocketId(
      message.senderId.toString()
    );

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageEdited", editData);
    }

    if (senderSocketId) {
      io.to(senderSocketId).emit("messageEdited", editData);
    }

    res.status(200).json({
      message: "Message updated successfully",
      editedMessage: editData,
    });
  } catch (error) {
    console.log("Edit message error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Forward message to Private Chat
export const forwardMessage = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const { messageId, sourceType = "private" } = req.body;
    const senderId = req.user._id;

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(receiverId) ||
      !mongoose.Types.ObjectId.isValid(messageId)
    ) {
      return res.status(400).json({
        error: "Invalid receiver or message ID",
      });
    }

    if (!["private", "group"].includes(sourceType)) {
      return res.status(400).json({
        error: "Invalid source type",
      });
    }

    // Check receiver
    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({
        error: "Receiver not found",
      });
    }

    let originalMessage = null;

    // Get original private message
    if (sourceType === "private") {
      originalMessage = await Message.findOne({
        _id: messageId,
        $or: [
          { senderId },
          { receiverId: senderId },
        ],
        deletedFor: { $ne: senderId },
        isDeleted: false,
      });
    }

    // Get original group message
    if (sourceType === "group") {
      originalMessage = await GroupMessage.findOne({
        _id: messageId,
        deletedFor: { $ne: senderId },
        isDeleted: false,
      });

      if (originalMessage) {
        const sourceGroup = await Group.findOne({
          _id: originalMessage.groupId,
          members: senderId,
        });

        if (!sourceGroup) {
          originalMessage = null;
        }
      }
    }

    if (!originalMessage) {
      return res.status(404).json({
        error: "Original message not found or unavailable",
      });
    }

    // Find or create private conversation
    let conversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        members: [senderId, receiverId],
      });
    }

    // Create forwarded message
    const forwardedMessage = new Message({
      senderId,
      receiverId,
      message: originalMessage.message,
      isForwarded: true,
    });

    conversation.messages.push(forwardedMessage._id);

    await Promise.all([
      conversation.save(),
      forwardedMessage.save(),
    ]);

    // Send realtime message to receiver
    const receiverSocketId = getReceiverSocketId(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit(
        "newMessage",
        forwardedMessage
      );
    }

    return res.status(201).json({
      message: "Message forwarded successfully",
      forwardedMessage,
    });
  } catch (error) {
    console.log("Forward private message error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

