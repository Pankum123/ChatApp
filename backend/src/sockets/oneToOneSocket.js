
import Message from "../modules/message/message.model.js";

const oneToOneSocket = async (io, socket, userId, getReceiverSocketId) => {
  // Login hone par pending messages delivered mark karna
  try {
    const pendingMessages = await Message.find({
      receiverId: userId,
      status: "sent",
    });

    await Promise.all(
      pendingMessages.map(async (message) => {
        message.status = "delivered";
        message.deliveredAt = new Date();
        await message.save();

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
      })
    );
  } catch (error) {
    console.log("Pending messages delivery error:", error);
  }

  // Message delivered event
  socket.on("messageDelivered", async ({ messageId } = {}) => {
    try {
      const message = await Message.findOneAndUpdate(
        {
          _id: messageId,
          receiverId: userId,
          status: "sent",
        },
        {
          $set: {
            status: "delivered",
            deliveredAt: new Date(),
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
      console.log("Message delivered error:", error);
    }
  });

  // Message read event
  socket.on("messagesRead", async ({ senderId } = {}) => {
    try {
      const unreadMessages = await Message.find({
        senderId,
        receiverId: userId,
        status: { $ne: "read" },
      });

      if (unreadMessages.length === 0) return;

      const readAt = new Date();

      await Promise.all(
        unreadMessages.map(async (message) => {
          message.status = "read";
          message.readAt = readAt;

          if (!message.deliveredAt) {
            message.deliveredAt = readAt;
          }

          await message.save();

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
        })
      );
    } catch (error) {
      console.log("Messages read error:", error);
    }
  });
};

export default oneToOneSocket;
