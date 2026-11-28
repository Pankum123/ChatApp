import mongoose from "mongoose";
import Message from "../modules/message/message.model.js";
import Conversation from "../modules/conversation/conversation.model.js";

// Check whether two users belong to the same private conversation
const hasPrivateConversation = async (userId, otherUserId) => {
  return Conversation.exists({
    members: {
      $all: [userId, otherUserId],
      $size: 2,
    },
  });
};

const oneToOneSocket = async (io, socket, userId, getReceiverSocketId) => {
  // Login hone par pending messages delivered mark karna
  // Optimized using bulk update
  try {
    const pendingMessages = await Message.find({
      receiverId: userId,
      status: "sent",
    })
      .select("_id senderId")
      .lean();

    if (pendingMessages.length > 0) {
      const messageIds = pendingMessages.map((message) => message._id);
      const deliveredAt = new Date();

      await Message.updateMany(
        {
          _id: { $in: messageIds },
          receiverId: userId,
          status: "sent",
        },
        {
          $set: {
            status: "delivered",
            deliveredAt,
          },
        }
      );

      // Only fetch messages successfully marked as delivered
      const deliveredMessages = await Message.find({
        _id: { $in: messageIds },
        receiverId: userId,
        status: "delivered",
        deliveredAt,
      })
        .select("_id senderId deliveredAt")
        .lean();

      // Notify online senders
      deliveredMessages.forEach((message) => {
        const senderSocketId = getReceiverSocketId(
          message.senderId.toString()
        );

        if (senderSocketId) {
          io.to(senderSocketId).emit("messageStatusUpdated", {
            messageId: message._id.toString(),
            status: "delivered",
            deliveredAt: message.deliveredAt,
          });
        }
      });
    }
  } catch (error) {
    console.error("Pending messages delivery error:", error);
  }

  // Message delivered event
  socket.on("messageDelivered", async ({ messageId } = {}) => {
    try {
      // Validate message ID
      if (
        !messageId ||
        typeof messageId !== "string" ||
        !mongoose.Types.ObjectId.isValid(messageId)
      ) {
        return;
      }

      // Find message received by authenticated user
      const existingMessage = await Message.findOne({
        _id: messageId,
        receiverId: userId,
        status: "sent",
      })
        .select("senderId")
        .lean();

      if (!existingMessage) return;

      // Verify sender and receiver belong to the same private conversation
      const conversationExists = await hasPrivateConversation(
        userId,
        existingMessage.senderId
      );

      if (!conversationExists) return;

      // Update delivery status
      const deliveredAt = new Date();

      const message = await Message.findOneAndUpdate(
        {
          _id: messageId,
          receiverId: userId,
          status: "sent",
        },
        {
          $set: {
            status: "delivered",
            deliveredAt,
          },
        },
        { new: true }
      );

      if (!message) return;

      const senderSocketId = getReceiverSocketId(
        message.senderId.toString()
      );

      if (senderSocketId) {
        io.to(senderSocketId).emit("messageStatusUpdated", {
          messageId: message._id.toString(),
          status: "delivered",
          deliveredAt: message.deliveredAt,
        });
      }
    } catch (error) {
      console.error("Message delivered error:", error);
    }
  });

  // Message read event
  socket.on("messagesRead", async ({ senderId } = {}) => {
    try {
      // Validate sender ID
      if (
        !senderId ||
        typeof senderId !== "string" ||
        !mongoose.Types.ObjectId.isValid(senderId) ||
        senderId === userId.toString()
      ) {
        return;
      }

      // Verify private conversation
      const conversationExists = await hasPrivateConversation(
        userId,
        senderId
      );

      if (!conversationExists) return;

      // Find unread messages
      const unreadMessages = await Message.find({
        senderId,
        receiverId: userId,
        status: { $ne: "read" },
      })
        .select("_id")
        .lean();

      if (unreadMessages.length === 0) return;

      const messageIds = unreadMessages.map((message) => message._id);
      const readAt = new Date();

      // Bulk update unread messages
      await Message.updateMany(
        {
          _id: { $in: messageIds },
          senderId,
          receiverId: userId,
          status: { $ne: "read" },
        },
        [
          {
            $set: {
              status: "read",
              readAt,
              deliveredAt: {
                $ifNull: ["$deliveredAt", readAt],
              },
            },
          },
        ]
      );

      // Fetch messages successfully marked as read
      const readMessages = await Message.find({
        _id: { $in: messageIds },
        senderId,
        receiverId: userId,
        status: "read",
        readAt,
      })
        .select("_id senderId deliveredAt readAt")
        .lean();

      // Notify senders
      readMessages.forEach((message) => {
        const senderSocketId = getReceiverSocketId(
          message.senderId.toString()
        );

        if (senderSocketId) {
          io.to(senderSocketId).emit("messageStatusUpdated", {
            messageId: message._id.toString(),
            status: "read",
            deliveredAt: message.deliveredAt,
            readAt: message.readAt,
          });
        }
      });
    } catch (error) {
      console.error("Messages read error:", error);
    }
  });

  // Private chat typing event with authorization
  socket.on("typing", async ({ receiverId } = {}) => {
    try {
      if (
        !userId ||
        !receiverId ||
        typeof receiverId !== "string" ||
        !mongoose.Types.ObjectId.isValid(receiverId) ||
        receiverId === userId.toString()
      ) {
        return;
      }

      const conversationExists = await hasPrivateConversation(
        userId,
        receiverId
      );

      if (!conversationExists) return;

      io.to(receiverId).emit("userTyping", {
        senderId: userId.toString(),
      });
    } catch (error) {
      console.error("Typing authorization error:", error);
    }
  });

  // Private chat stop typing event with authorization
  socket.on("stopTyping", async ({ receiverId } = {}) => {
    try {
      if (
        !userId ||
        !receiverId ||
        typeof receiverId !== "string" ||
        !mongoose.Types.ObjectId.isValid(receiverId) ||
        receiverId === userId.toString()
      ) {
        return;
      }

      const conversationExists = await hasPrivateConversation(
        userId,
        receiverId
      );

      if (!conversationExists) return;

      io.to(receiverId).emit("userStopTyping", {
        senderId: userId.toString(),
      });
    } catch (error) {
      console.error("Stop typing authorization error:", error);
    }
  });
};

export default oneToOneSocket;
