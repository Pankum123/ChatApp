import { randomUUID } from "node:crypto";
import Group from "../modules/group/group.model.js";
import GroupMessage from "../modules/group/groupMessage.model.js";

const activeGroupCalls = new Map();
const userGroupCalls = new Map();

const MAX_GROUP_CALL_PARTICIPANTS = 6;

const isValidId = (value) =>
  typeof value === "string" && /^[a-f\d]{24}$/i.test(value);

const normalizeId = (value) => String(value).toLowerCase();

const toParticipant = (member) => ({
  userId: String(member._id),
  fullname: member.fullname || "ChatApp User",
  profilePic: member.profilePic || { url: "" },
});

const emitError = (socket, message, code = "GROUP_CALL_ERROR") => {
  socket.emit("group-call:error", { code, message });
};

const getGroupMember = async (groupId, userId) => {
  if (!isValidId(groupId) || !isValidId(userId)) return null;

  return Group.findOne({
    _id: groupId,
    members: userId,
  }).populate("members", "fullname profilePic");
};

const getParticipantIds = (call) =>
  Array.from(call.participants.keys());

// ============================================
// SAVE GROUP CALL HISTORY
// ============================================

const saveGroupCallHistory = async (io, call, status) => {
  if (!call || call.historySaved) return;

  call.historySaved = true;

  try {
    const endedAt = new Date();

    const duration =
      status === "completed" && call.everJoinedOther
        ? Math.max(
            0,
            Math.floor(
              (endedAt.getTime() - call.createdAt.getTime()) / 1000
            )
          )
        : 0;

    const groupMessage = await GroupMessage.create({
      groupId: call.groupId,
      senderId: call.startedById,
      message: "",
      messageType: "call",
      call: {
        callType: call.callType,
        status,
        duration,
        hostId: call.startedById,
        participantIds: Array.from(call.joinedParticipantIds),
        startedAt: call.createdAt,
        endedAt,
      },
    });

    const populatedMessage = await GroupMessage.findById(
      groupMessage._id
    ).populate("senderId", "fullname email");

    io.to(call.groupId).emit(
      "newGroupMessage",
      populatedMessage
    );

    console.log("Group call history saved:", status);
  } catch (error) {
    call.historySaved = false;
    console.error("Save group call history error:", error);
  }
};

// ============================================
// REMOVE ACTIVE CALL
// ============================================

const removeCall = (callId) => {
  const call = activeGroupCalls.get(callId);

  if (!call) return null;

  activeGroupCalls.delete(callId);

  for (const participantId of call.participants.keys()) {
    if (userGroupCalls.get(participantId) === callId) {
      userGroupCalls.delete(participantId);
    }
  }

  return call;
};

// ============================================
// GROUP CALL SOCKET
// ============================================

const groupCallSocket = (io, socket, userId) => {
  if (!isValidId(userId)) return;

  const currentUserId = normalizeId(userId);

  // ==========================================
  // START GROUP CALL
  // ==========================================

  socket.on("group-call:start", async ({ groupId, callType } = {}) => {
    try {
      if (!isValidId(groupId) || !["audio", "video"].includes(callType)) {
        emitError(socket, "Invalid group call request.", "INVALID_REQUEST");
        return;
      }

      if (userGroupCalls.has(currentUserId)) {
        emitError(socket, "You are already in another group call.", "USER_BUSY");
        return;
      }

      const group = await getGroupMember(groupId, currentUserId);

      if (!group) {
        emitError(socket, "You are not a member of this group.", "NOT_GROUP_MEMBER");
        return;
      }

      const normalizedGroupId = String(group._id);

      const existingCall = Array.from(activeGroupCalls.values()).find(
        (item) => item.groupId === normalizedGroupId
      );

      if (existingCall) {
        emitError(socket, "This group already has an active call.", "CALL_ALREADY_ACTIVE");
        return;
      }

      const caller = group.members.find(
        (member) => normalizeId(member._id) === currentUserId
      );

      if (!caller) {
        emitError(socket, "Unable to identify your group membership.", "NOT_GROUP_MEMBER");
        return;
      }

      const callId = randomUUID();
      const callerDetails = toParticipant(caller);
      const createdAt = new Date();

      const call = {
        callId,
        groupId: normalizedGroupId,
        groupName: group.groupName,
        callType,
        hostId: currentUserId,
        startedById: currentUserId,
        participants: new Map([[currentUserId, callerDetails]]),
        joinedParticipantIds: new Set([currentUserId]),
        createdAt,
        everJoinedOther: false,
        historySaved: false,
      };

      activeGroupCalls.set(callId, call);
      userGroupCalls.set(currentUserId, callId);

      socket.emit("group-call:started", {
        callId,
        groupId: call.groupId,
        groupName: call.groupName,
        callType,
        hostId: call.hostId,
        participants: [callerDetails],
      });

      // Invite all other current group members.
      for (const member of group.members) {
        const memberId = normalizeId(member._id);

        if (memberId === currentUserId) continue;

        io.to(memberId).emit("group-call:incoming", {
          callId,
          groupId: call.groupId,
          groupName: call.groupName,
          callType,
          caller: callerDetails,
          hostId: call.hostId,
        });
      }

      console.log("Group call started:", callId, "group:", normalizedGroupId);
    } catch (error) {
      console.error("Group call start error:", error);
      emitError(socket, "Unable to start group call.");
    }
  });

  // ==========================================
  // JOIN GROUP CALL
  // ==========================================

  socket.on("group-call:join", async ({ callId } = {}) => {
    try {
      const call = activeGroupCalls.get(callId);

      if (!call) {
        emitError(socket, "This group call is no longer available.", "CALL_NOT_FOUND");
        return;
      }

      const group = await getGroupMember(call.groupId, currentUserId);

      if (!group) {
        emitError(socket, "You are not a member of this group.", "NOT_GROUP_MEMBER");
        return;
      }

      const alreadyJoined = call.participants.has(currentUserId);

      if (!alreadyJoined && userGroupCalls.has(currentUserId)) {
        emitError(socket, "You are already in another group call.", "USER_BUSY");
        return;
      }

      if (
        !alreadyJoined &&
        call.participants.size >= MAX_GROUP_CALL_PARTICIPANTS
      ) {
        emitError(
          socket,
          `This group call is limited to ${MAX_GROUP_CALL_PARTICIPANTS} participants.`,
          "CALL_FULL"
        );
        return;
      }

      const member = group.members.find(
        (item) => normalizeId(item._id) === currentUserId
      );

      if (!member) return;

      const participant = toParticipant(member);

      if (!alreadyJoined) {
        const existingParticipantIds = getParticipantIds(call);

        call.participants.set(currentUserId, participant);
        call.joinedParticipantIds.add(currentUserId);
        call.everJoinedOther = true;

        userGroupCalls.set(currentUserId, callId);

        for (const participantId of existingParticipantIds) {
          io.to(participantId).emit("group-call:participant-joined", {
            callId,
            participant,
          });
        }
      }

      socket.emit("group-call:joined", {
        callId,
        groupId: call.groupId,
        groupName: call.groupName,
        callType: call.callType,
        hostId: call.hostId,
        participants: Array.from(call.participants.values()),
      });

      console.log("Group call participant joined:", currentUserId, callId);
    } catch (error) {
      console.error("Group call join error:", error);
      emitError(socket, "Unable to join group call.");
    }
  });

  // ==========================================
  // REJECT GROUP CALL INVITATION
  // ==========================================

  socket.on("group-call:reject", ({ callId } = {}) => {
    const call = activeGroupCalls.get(callId);

    if (!call || call.participants.has(currentUserId)) return;

    io.to(call.hostId).emit("group-call:rejected", {
      callId,
      userId: currentUserId,
    });
  });

  // ==========================================
  // WEBRTC SIGNALING
  // ==========================================

  const relaySignal = (eventName, fieldName, expectedType) => {
    socket.on(
      eventName,
      ({ callId, targetUserId, [fieldName]: value } = {}) => {
        const call = activeGroupCalls.get(callId);

        const targetId = isValidId(targetUserId)
          ? normalizeId(targetUserId)
          : null;

        if (
          !call ||
          !targetId ||
          targetId === currentUserId ||
          !call.participants.has(currentUserId) ||
          !call.participants.has(targetId) ||
          !value ||
          typeof value !== "object"
        ) {
          return;
        }

        if (
          expectedType &&
          (value.type !== expectedType || typeof value.sdp !== "string")
        ) {
          return;
        }

        io.to(targetId).emit(eventName, {
          callId,
          fromUserId: currentUserId,
          [fieldName]: value,
        });
      }
    );
  };

  relaySignal("group-call:offer", "offer", "offer");
  relaySignal("group-call:answer", "answer", "answer");
  relaySignal("group-call:ice-candidate", "candidate", null);

  // ==========================================
  // LEAVE PARTICIPANT
  // ==========================================

  const leaveParticipant = async (
    callId,
    reason = "participant_left"
  ) => {
    const call = activeGroupCalls.get(callId);

    if (!call || !call.participants.has(currentUserId)) return;

    call.participants.delete(currentUserId);

    if (userGroupCalls.get(currentUserId) === callId) {
      userGroupCalls.delete(currentUserId);
    }

    // Save history when the last participant leaves.
    if (call.participants.size === 0) {
      const status = call.everJoinedOther
        ? "completed"
        : "cancelled";

      await saveGroupCallHistory(io, call, status);
      removeCall(callId);
      return;
    }

    // Promote another participant if the host leaves.
    if (call.hostId === currentUserId) {
      call.hostId = call.participants.keys().next().value;
    }

    const payload = {
      callId,
      userId: currentUserId,
      hostId: call.hostId,
      reason,
    };

    for (const participantId of call.participants.keys()) {
      io.to(participantId).emit(
        "group-call:participant-left",
        payload
      );
    }
  };

  socket.on("group-call:leave", async ({ callId } = {}) => {
    try {
      await leaveParticipant(callId);
    } catch (error) {
      console.error("Group call leave error:", error);
    }
  });

  // ==========================================
  // END GROUP CALL FOR EVERYONE
  // ==========================================

  socket.on("group-call:end", async ({ callId } = {}) => {
    try {
      const call = activeGroupCalls.get(callId);

      if (!call || call.hostId !== currentUserId) return;

      const status = call.everJoinedOther
        ? "completed"
        : "cancelled";

      await saveGroupCallHistory(io, call, status);

      for (const participantId of call.participants.keys()) {
        if (participantId !== currentUserId) {
          io.to(participantId).emit("group-call:ended", {
            callId,
            endedBy: currentUserId,
          });
        }
      }

      removeCall(callId);

      socket.emit("group-call:ended", {
        callId,
        endedBy: currentUserId,
      });

      console.log("Group call ended:", callId);
    } catch (error) {
      console.error("Group call end error:", error);
    }
  });

  // ==========================================
  // DISCONNECT CLEANUP
  // ==========================================

  socket.on("disconnect", async () => {
    try {
      const remainingSockets = await io
        .in(currentUserId)
        .fetchSockets();

      if (remainingSockets.length > 0) return;

      const callId = userGroupCalls.get(currentUserId);

      if (callId) {
        await leaveParticipant(
          callId,
          "participant_disconnected"
        );
      }
    } catch (error) {
      console.error("Group call disconnect cleanup error:", error);
    }
  });
};

export default groupCallSocket;
