import Group from "../modules/group/group.model.js";
import GroupMessage from "../modules/group/groupMessage.model.js";

// MongoDB ObjectId validation
const isValidObjectId = (id) => {
  return (
    typeof id === "string" &&
    /^[a-f\d]{24}$/i.test(id)
  );
};

// Calculate group message status based on all other members
const getMessageStatus = (message, group) => {
  const senderId = message.senderId.toString();

  const otherMembers = group.members
    .map((member) => member.toString())
    .filter((memberId) => memberId !== senderId);

  if (otherMembers.length === 0) return null;

  const deliveredTo = new Set(
    (message.deliveredTo || []).map((id) => id.toString())
  );

  const readBy = new Set(
    (message.readBy || []).map((id) => id.toString())
  );

  const allDelivered = otherMembers.every((id) =>
    deliveredTo.has(id)
  );

  const allRead = otherMembers.every((id) =>
    readBy.has(id)
  );

  let status = "sent";

  if (allDelivered) {
    status = "delivered";
  }

  if (allRead) {
    status = "read";
  }

  const now = new Date();

  const updateFields = { status };

  if (allDelivered && !message.deliveredAt) {
    updateFields.deliveredAt = now;
  }

  if (allRead && !message.readAt) {
    updateFields.readAt = now;
  }

  return updateFields;
};

// Update multiple message statuses and notify senders
const syncGroupMessageStatuses = async (
  io,
  messages,
  groupMap,
  getReceiverSocketId
) => {
  if (!messages.length) return;

  const bulkOperations = [];
  const notifications = [];

  for (const message of messages) {
    const group = groupMap.get(
      message.groupId.toString()
    );

    if (!group) continue;

    const updateFields = getMessageStatus(message, group);

    if (!updateFields) continue;

    bulkOperations.push({
      updateOne: {
        filter: {
          _id: message._id,
        },
        update: {
          $set: updateFields,
        },
      },
    });

    notifications.push({
      message,
      updateFields,
    });
  }

  if (!bulkOperations.length) return;

  await GroupMessage.bulkWrite(bulkOperations);

  // Notify online senders
  notifications.forEach(({ message, updateFields }) => {
    const senderSocketId = getReceiverSocketId(
      message.senderId.toString()
    );

    if (!senderSocketId) return;

    io.to(senderSocketId).emit("groupMessageStatusUpdated", {
      messageId: message._id.toString(),
      status: updateFields.status,
      deliveredTo: message.deliveredTo,
      readBy: message.readBy,
      deliveredAt:
        updateFields.deliveredAt || message.deliveredAt,
      readAt: updateFields.readAt || message.readAt,
    });
  });
};

const groupSocket = async (
  io,
  socket,
  userId,
  getReceiverSocketId
) => {
  if (!userId) return;

  const authenticatedUserId = userId.toString();

  // Load authenticated user's groups and join authorized rooms
  let userGroups = [];

  try {
    userGroups = await Group.find({
      members: authenticatedUserId,
    })
      .select("_id members")
      .lean();

    for (const group of userGroups) {
      await socket.join(group._id.toString());
    }

    console.log("User joined group rooms:", userGroups.length);
  } catch (error) {
    console.error("Group room join error:", error);
  }

  // Group lookup map
  const groupMap = new Map(
    userGroups.map((group) => [
      group._id.toString(),
      group,
    ])
  );

  // Join newly created or selected group
  socket.on("joinGroup", async ({ groupId } = {}, callback) => {
    const respond = (result) => {
      if (typeof callback === "function") {
        callback(result);
      }
    };

    try {
      if (!isValidObjectId(groupId)) {
        return respond({
          success: false,
          message: "Invalid group ID",
        });
      }

      const group = await Group.findOne({
        _id: groupId,
        members: authenticatedUserId,
      })
        .select("_id members groupName")
        .lean();

      if (!group) {
        return respond({
          success: false,
          message: "You are not a member of this group",
        });
      }

      await socket.join(group._id.toString());

      groupMap.set(group._id.toString(), group);

      console.log("User joined group room:", group.groupName);

      respond({ success: true });
    } catch (error) {
      console.error("Group room join error:", error);

      respond({
        success: false,
        message: "Unable to join group room",
      });
    }
  });

  // Login par pending group messages delivered mark karna
  try {
    if (userGroups.length > 0) {
      const groupIds = userGroups.map((group) => group._id);

      const pendingMessages = await GroupMessage.find({
        groupId: { $in: groupIds },
        senderId: { $ne: authenticatedUserId },
        deliveredTo: { $ne: authenticatedUserId },
      })
        .select("_id")
        .lean();

      if (pendingMessages.length > 0) {
        const messageIds = pendingMessages.map(
          (message) => message._id
        );

        // Bulk delivery update
        await GroupMessage.updateMany(
          {
            _id: { $in: messageIds },
            deliveredTo: { $ne: authenticatedUserId },
          },
          {
            $addToSet: {
              deliveredTo: authenticatedUserId,
            },
          }
        );

        // Fetch updated messages
        const updatedMessages = await GroupMessage.find({
          _id: { $in: messageIds },
        }).lean();

        await syncGroupMessageStatuses(
          io,
          updatedMessages,
          groupMap,
          getReceiverSocketId
        );
      }
    }
  } catch (error) {
    console.error(
      "Pending group messages delivery error:",
      error
    );
  }

  // Group message delivered event
  socket.on(
    "groupMessageDelivered",
    async ({ messageId } = {}) => {
      try {
        if (!isValidObjectId(messageId)) return;

        // Find message not sent by authenticated user
        const existingMessage = await GroupMessage.findOne({
          _id: messageId,
          senderId: { $ne: authenticatedUserId },
        })
          .select("_id groupId")
          .lean();

        if (!existingMessage) return;

        // Verify current user is a group member
        const group = await Group.findOne({
          _id: existingMessage.groupId,
          members: authenticatedUserId,
        })
          .select("_id members")
          .lean();

        if (!group) return;

        // Atomic delivery update
        const result = await GroupMessage.updateOne(
          {
            _id: messageId,
            groupId: group._id,
            senderId: { $ne: authenticatedUserId },
            deliveredTo: { $ne: authenticatedUserId },
          },
          {
            $addToSet: {
              deliveredTo: authenticatedUserId,
            },
          }
        );

        if (result.modifiedCount === 0) return;

        const updatedMessage = await GroupMessage.findById(
          messageId
        ).lean();

        if (!updatedMessage) return;

        const currentGroupMap = new Map([
          [group._id.toString(), group],
        ]);

        await syncGroupMessageStatuses(
          io,
          [updatedMessage],
          currentGroupMap,
          getReceiverSocketId
        );
      } catch (error) {
        console.error("Group message delivered error:", error);
      }
    }
  );

  // Group messages read event
  socket.on(
    "groupMessagesRead",
    async ({ groupId } = {}) => {
      try {
        if (!isValidObjectId(groupId)) return;

        // Verify group membership
        const group = await Group.findOne({
          _id: groupId,
          members: authenticatedUserId,
        })
          .select("_id members")
          .lean();

        if (!group) return;

        // Find unread messages from other members
        const unreadMessages = await GroupMessage.find({
          groupId: group._id,
          senderId: { $ne: authenticatedUserId },
          readBy: { $ne: authenticatedUserId },
        })
          .select("_id")
          .lean();

        if (unreadMessages.length === 0) return;

        const messageIds = unreadMessages.map(
          (message) => message._id
        );

        // Bulk mark messages as delivered and read
        await GroupMessage.updateMany(
          {
            _id: { $in: messageIds },
            groupId: group._id,
            senderId: { $ne: authenticatedUserId },
            readBy: { $ne: authenticatedUserId },
          },
          {
            $addToSet: {
              deliveredTo: authenticatedUserId,
              readBy: authenticatedUserId,
            },
          }
        );

        // Fetch updated messages
        const updatedMessages = await GroupMessage.find({
          _id: { $in: messageIds },
        }).lean();

        const currentGroupMap = new Map([
          [group._id.toString(), group],
        ]);

        await syncGroupMessageStatuses(
          io,
          updatedMessages,
          currentGroupMap,
          getReceiverSocketId
        );
      } catch (error) {
        console.error("Group messages read error:", error);
      }
    }
  );

  // Group typing event
  socket.on("groupTyping", async ({ groupId } = {}) => {
    try {
      if (!isValidObjectId(groupId)) return;

      // Verify membership
      const isMember = await Group.exists({
        _id: groupId,
        members: authenticatedUserId,
      });

      if (!isMember) return;

      // Notify other group members
      socket.to(groupId).emit("groupUserTyping", {
        groupId,
        senderId: authenticatedUserId,
      });
    } catch (error) {
      console.error("Group typing error:", error);
    }
  });

  // Group stop typing event
  socket.on(
    "groupStopTyping",
    async ({ groupId } = {}) => {
      try {
        if (!isValidObjectId(groupId)) return;

        // Verify membership
        const isMember = await Group.exists({
          _id: groupId,
          members: authenticatedUserId,
        });

        if (!isMember) return;

        // Notify other group members
        socket.to(groupId).emit("groupUserStopTyping", {
          groupId,
          senderId: authenticatedUserId,
        });
      } catch (error) {
        console.error("Group stop typing error:", error);
      }
    }
  );
};

export default groupSocket;
