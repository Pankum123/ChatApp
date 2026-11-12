
import Group from "../modules/group/group.model.js";
import GroupMessage from "../modules/group/groupMessage.model.js";

const groupSocket = async (io, socket, userId, getReceiverSocketId) => {
  // User ko uske sabhi group rooms mein join karwana
  let userGroups = [];

  try {
    if (userId) {
      userGroups = await Group.find({
        members: userId,
      });

      userGroups.forEach((group) => {
        socket.join(group._id.toString());
      });

      console.log("User joined group rooms:", userGroups.length);
    }
  } catch (error) {
    console.log("Group room join error:", error);
  }


  // Newly created group ka room join karna
  socket.on("joinGroup", async ({ groupId } = {}, callback) => {
    try {
      if (!groupId || !userId) {
        return callback?.({
          success: false,
          message: "Group ID or User ID missing",
        });
      }

      // Check karo ki user is group ka member hai
      const group = await Group.findOne({
        _id: groupId,
        members: userId,
      });

      if (!group) {
        return callback?.({
          success: false,
          message: "You are not a member of this group",
        });
      }

      // Group room join karna
      await socket.join(group._id.toString());

      console.log("User joined new group room:", group.groupName);

      callback?.({ success: true });
    } catch (error) {
      console.log("New group room join error:", error);

      callback?.({
        success: false,
        message: "Unable to join group room",
      });
    }
  });


  // Group message ka overall status update karna
  const updateGroupMessageStatus = async (message) => {
    const group = await Group.findById(message.groupId);

    if (!group) return;

    const otherMembers = group.members
      .map((member) => member.toString())
      .filter((memberId) => memberId !== message.senderId.toString());

    // Sender ko count nahi karna
    if (otherMembers.length === 0) return;

    const deliveredTo = message.deliveredTo.map((id) => id.toString());
    const readBy = message.readBy.map((id) => id.toString());

    const allDelivered = otherMembers.every((id) =>
      deliveredTo.includes(id)
    );

    const allRead = otherMembers.every((id) =>
      readBy.includes(id)
    );

    let status = "sent";

    if (allDelivered) {
      status = "delivered";
    }

    if (allRead) {
      status = "read";
    }

    const updateFields = { status };

    if (allDelivered && !message.deliveredAt) {
      updateFields.deliveredAt = new Date();
    }

    if (allRead && !message.readAt) {
      updateFields.readAt = new Date();
    }

    const updatedMessage = await GroupMessage.findByIdAndUpdate(
      message._id,
      { $set: updateFields },
      { new: true }
    );

    // Sender ko updated tick status bhejna
    const senderSocketId = getReceiverSocketId(
      message.senderId.toString()
    );

    if (senderSocketId && updatedMessage) {
      io.to(senderSocketId).emit("groupMessageStatusUpdated", {
        messageId: updatedMessage._id.toString(),
        status: updatedMessage.status,
        deliveredTo: updatedMessage.deliveredTo,
        readBy: updatedMessage.readBy,
        deliveredAt: updatedMessage.deliveredAt,
        readAt: updatedMessage.readAt,
      });
    }
  };

  // Login par pending group messages delivered mark karna
  try {
    if (userGroups.length > 0) {
      const groupIds = userGroups.map((group) => group._id);

      const pendingMessages = await GroupMessage.find({
        groupId: { $in: groupIds },
        senderId: { $ne: userId },
        deliveredTo: { $ne: userId },
      });

      await Promise.all(
        pendingMessages.map(async (message) => {
          await GroupMessage.findByIdAndUpdate(message._id, {
            $addToSet: {
              deliveredTo: userId,
            },
          });

          const updatedMessage = await GroupMessage.findById(message._id);

          if (updatedMessage) {
            await updateGroupMessageStatus(updatedMessage);
          }
        })
      );
    }
  } catch (error) {
    console.log("Pending group messages delivery error:", error);
  }

  // Group message delivered event
  socket.on("groupMessageDelivered", async ({ messageId } = {}) => {
    try {
      const message = await GroupMessage.findById(messageId);

      if (!message || message.senderId.toString() === userId) return;

      const group = await Group.findOne({
        _id: message.groupId,
        members: userId,
      });

      if (!group) return;

      await GroupMessage.findByIdAndUpdate(messageId, {
        $addToSet: {
          deliveredTo: userId,
        },
      });

      const updatedMessage = await GroupMessage.findById(messageId);

      if (updatedMessage) {
        await updateGroupMessageStatus(updatedMessage);
      }
    } catch (error) {
      console.log("Group message delivered error:", error);
    }
  });

  // Group messages read event
  socket.on("groupMessagesRead", async ({ groupId } = {}) => {
    try {
      const group = await Group.findOne({
        _id: groupId,
        members: userId,
      });

      if (!group) return;

      const unreadMessages = await GroupMessage.find({
        groupId,
        senderId: { $ne: userId },
        readBy: { $ne: userId },
      });

      await Promise.all(
        unreadMessages.map(async (message) => {
          await GroupMessage.findByIdAndUpdate(message._id, {
            $addToSet: {
              deliveredTo: userId,
              readBy: userId,
            },
          });

          const updatedMessage = await GroupMessage.findById(message._id);

          if (updatedMessage) {
            await updateGroupMessageStatus(updatedMessage);
          }
        })
      );
    } catch (error) {
      console.log("Group messages read error:", error);
    }
  });
};

export default groupSocket;
