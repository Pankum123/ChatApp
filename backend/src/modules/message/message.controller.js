import { getReceiverSocketId, io } from "../../sockets/server.js";
import Conversation from "../conversation/conversation.model.js";
import Message from "./message.model.js";
import mongoose from "mongoose";

export const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id; // current logged in user
    let conversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });
    if (!conversation) {
      conversation = await Conversation.create({
        members: [senderId, receiverId],
      });
    }
    const newMessage = new Message({
      senderId,
      receiverId,
      message,
    });
    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }
    // await conversation.save()
    // await newMessage.save();
    await Promise.all([conversation.save(), newMessage.save()]); // run parallel
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }
    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessage = async (req, res) => {
  try {
    const { id: chatUser } = req.params;
    const senderId = req.user._id; // current logged in user
    let conversation = await Conversation.findOne({
      members: { $all: [senderId, chatUser] },
    }).populate("messages");
    if (!conversation) {
      return res.status(201).json([]);
    }
    // const messages = conversation.messages;
    const messages = conversation.messages.filter((message) => {
      return !message.deletedFor.some(
        (id) => id.toString() === senderId.toString()
      );
    });
    res.status(201).json(messages);
  } catch (error) {
    console.log("Error in getMessage", error);
    res.status(500).json({ error: "Internal server error" });
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
