import { getReceiverSocketId, io } from "../../sockets/server.js";
import Conversation from "../conversation/conversation.model.js";
import Message from "./message.model.js";
import mongoose from "mongoose";
import User from "../user/user.model.js";
import Group from "../group/group.model.js";
import GroupMessage from "../group/groupMessage.model.js";
import { v2 as cloudinary } from "cloudinary";


export const sendMessage = async (req, res) => {
  const uploadedAttachments = [];

  try {
    const { message = "", replyTo } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    const textMessage = typeof message === "string" ? message.trim() : "";

    // Validate receiver ID
    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({
        error: "Invalid receiver ID",
      });
    }

    if (senderId.toString() === receiverId) {
      return res.status(400).json({
        error: "Cannot send message to yourself",
      });
    }

    // Normalize uploaded files
    let files = req.files?.attachments || [];

    if (!Array.isArray(files)) {
      files = [files];
    }

    // Validate message content
    if (!textMessage && files.length === 0) {
      return res.status(400).json({
        error: "Message or attachment is required",
      });
    }

    // Validate attachment count
    if (files.length > 5) {
      return res.status(400).json({
        error: "Maximum 5 attachments allowed",
      });
    }

    const MAX_FILE_SIZE = 20 * 1024 * 1024;

    // Validate and upload attachments
    for (const file of files) {
      const { name, mimetype, size, tempFilePath } = file;

      if (size > MAX_FILE_SIZE) {
        throw new Error(`File ${name} exceeds 20 MB limit`);
      }

      let resourceType;

      if (
        ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(mimetype)
      ) {
        resourceType = "image";
      } else if (
        mimetype.startsWith("video/") ||
        mimetype.startsWith("audio/")
      ) {
        resourceType = "video";
      } else if (mimetype === "application/pdf") {
        resourceType = "image";
      } else {
        throw new Error(`File type not supported: ${name}`);
      }

      const cloudResponse = await cloudinary.uploader.upload(
        tempFilePath,
        {
          folder: "chatapp/private-chat",
          resource_type: resourceType,
          use_filename: true,
          unique_filename: true,
        }
      );

      if (!cloudResponse?.public_id) {
        throw new Error(`Failed to upload ${name}`);
      }

      uploadedAttachments.push({
        url: cloudResponse.secure_url,
        publicId: cloudResponse.public_id,
        fileName: name,
        fileType: mimetype,
        fileSize: size,
        resourceType,
      });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        members: [senderId, receiverId],
      });
    }

    // Validate reply message
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

    // Create new message
    const newMessage = new Message({
      senderId,
      receiverId,
      message: textMessage,
      attachments: uploadedAttachments,
      replyTo: replyMessage ? replyMessage._id : null,
    });

    conversation.messages.push(newMessage._id);

    await Promise.all([
      conversation.save(),
      newMessage.save(),
    ]);

    // Populate reply message
    await newMessage.populate({
      path: "replyTo",
      select: "message senderId isDeleted",
    });

    // Emit real-time message
    const receiverSocketId = getReceiverSocketId(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    return res.status(201).json(newMessage);

  } catch (error) {
    console.log("Error in sendMessage:", error);

    // Remove uploaded files if message creation fails
    await Promise.all(
      uploadedAttachments.map(async (attachment) => {
        try {
          await cloudinary.uploader.destroy(
            attachment.publicId,
            {
              resource_type: attachment.resourceType,
            }
          );
        } catch (deleteError) {
          console.log("Cloudinary cleanup error:", deleteError);
        }
      })
    );

    const isValidationError =
      error.message.includes("exceeds 20 MB") ||
      error.message.includes("not supported") ||
      error.message.includes("Failed to upload");

    return res.status(isValidationError ? 400 : 500).json({
      error: isValidationError
        ? error.message
        : "Internal server error",
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

