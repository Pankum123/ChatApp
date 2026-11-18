
import { randomUUID } from "node:crypto";

// ============================================
// ACTIVE CALL MANAGEMENT
// ============================================

const activeCalls = new Map();
const userActiveCalls = new Map();

const RING_TIMEOUT = 30 * 1000;

const isValidUserId = (id) => {
  return (
    typeof id === "string" &&
    /^[a-f\d]{24}$/i.test(id)
  );
};

const removeCall = (callId) => {
  const call = activeCalls.get(callId);

  if (!call) return null;

  if (call.timeout) {
    clearTimeout(call.timeout);
  }

  activeCalls.delete(callId);

  if (userActiveCalls.get(call.callerId) === callId) {
    userActiveCalls.delete(call.callerId);
  }

  if (userActiveCalls.get(call.receiverId) === callId) {
    userActiveCalls.delete(call.receiverId);
  }

  return call;
};

// ============================================
// CALL SOCKET
// ============================================

const callSocket = (io, socket, userId) => {
  if (!isValidUserId(userId)) {
    console.log("Invalid user ID for calling socket");
    return;
  }

  const currentUserId = userId.toString().toLowerCase();

  // ==========================================
  // 1. INITIATE CALL
  // ==========================================

  socket.on("call:invite", ({ receiverId, callType } = {}) => {
    try {
      if (!isValidUserId(receiverId)) {
        socket.emit("call:error", {
          code: "INVALID_RECEIVER",
          message: "Invalid receiver ID",
        });
        return;
      }

      const targetUserId = receiverId.toLowerCase();

      if (
        targetUserId === currentUserId ||
        !["audio", "video"].includes(callType)
      ) {
        socket.emit("call:error", {
          code: "INVALID_CALL_REQUEST",
          message: "Invalid call request",
        });
        return;
      }

      // Caller already busy
      if (userActiveCalls.has(currentUserId)) {
        socket.emit("call:error", {
          code: "CALLER_BUSY",
          message: "You are already in a call",
        });
        return;
      }

      // Receiver offline
      const receiverRoom = io.sockets.adapter.rooms.get(targetUserId);

      if (!receiverRoom || receiverRoom.size === 0) {
        socket.emit("call:unavailable", {
          receiverId: targetUserId,
        });
        return;
      }

      // Receiver already busy
      if (userActiveCalls.has(targetUserId)) {
        socket.emit("call:busy", {
          receiverId: targetUserId,
        });
        return;
      }

      const callId = randomUUID();

      const call = {
        callId,
        callerId: currentUserId,
        receiverId: targetUserId,
        callType,
        status: "ringing",
        createdAt: new Date(),
        timeout: null,
      };

      activeCalls.set(callId, call);

      userActiveCalls.set(currentUserId, callId);
      userActiveCalls.set(targetUserId, callId);

      // Notify receiver
      io.to(targetUserId).emit("call:incoming", {
        callId,
        callerId: currentUserId,
        callType,
      });

      // Notify caller
      socket.emit("call:outgoing", {
        callId,
        receiverId: targetUserId,
        callType,
      });

      // Ring timeout: 30 seconds
      call.timeout = setTimeout(() => {
        const currentCall = activeCalls.get(callId);

        if (!currentCall || currentCall.status !== "ringing") {
          return;
        }

        io.to(currentCall.callerId).emit("call:timeout", {
          callId,
          receiverId: currentCall.receiverId,
        });

        io.to(currentCall.receiverId).emit("call:timeout", {
          callId,
          callerId: currentCall.callerId,
        });

        removeCall(callId);

        console.log("Call timed out:", callId);
      }, RING_TIMEOUT);

      console.log("Call initiated:", callId);

    } catch (error) {
      console.error("Call invite error:", error);
    }
  });

  // ==========================================
  // 2. ACCEPT CALL
  // ==========================================

  socket.on("call:accept", ({ callId } = {}) => {
    try {
      const call = activeCalls.get(callId);

      if (
        !call ||
        call.receiverId !== currentUserId ||
        call.status !== "ringing"
      ) {
        return;
      }

      call.status = "accepted";

      if (call.timeout) {
        clearTimeout(call.timeout);
        call.timeout = null;
      }

      io.to(call.callerId).emit("call:accepted", {
        callId,
        receiverId: currentUserId,
      });

      console.log("Call accepted:", callId);

    } catch (error) {
      console.error("Call accept error:", error);
    }
  });

  // ==========================================
  // 3. REJECT CALL
  // ==========================================

  socket.on("call:reject", ({ callId } = {}) => {
    try {
      const call = activeCalls.get(callId);

      if (
        !call ||
        call.receiverId !== currentUserId ||
        call.status !== "ringing"
      ) {
        return;
      }

      io.to(call.callerId).emit("call:rejected", {
        callId,
        receiverId: currentUserId,
      });

      removeCall(callId);

      console.log("Call rejected:", callId);

    } catch (error) {
      console.error("Call reject error:", error);
    }
  });

  // ==========================================
  // 4. WEBRTC OFFER
  // ==========================================

  socket.on("call:offer", ({ callId, offer } = {}) => {
    try {
      const call = activeCalls.get(callId);

      if (
        !call ||
        call.callerId !== currentUserId ||
        call.status !== "accepted" ||
        !offer ||
        offer.type !== "offer" ||
        typeof offer.sdp !== "string"
      ) {
        return;
      }

      io.to(call.receiverId).emit("call:offer", {
        callId,
        offer,
      });

    } catch (error) {
      console.error("Call offer error:", error);
    }
  });

  // ==========================================
  // 5. WEBRTC ANSWER
  // ==========================================

  socket.on("call:answer", ({ callId, answer } = {}) => {
    try {
      const call = activeCalls.get(callId);

      if (
        !call ||
        call.receiverId !== currentUserId ||
        call.status !== "accepted" ||
        !answer ||
        answer.type !== "answer" ||
        typeof answer.sdp !== "string"
      ) {
        return;
      }

      io.to(call.callerId).emit("call:answer", {
        callId,
        answer,
      });

    } catch (error) {
      console.error("Call answer error:", error);
    }
  });

  // ==========================================
  // 6. ICE CANDIDATE EXCHANGE
  // ==========================================

  socket.on(
    "call:ice-candidate",
    ({ callId, candidate } = {}) => {
      try {
        const call = activeCalls.get(callId);

        if (
          !call ||
          call.status !== "accepted" ||
          !candidate ||
          typeof candidate !== "object"
        ) {
          return;
        }

        let targetUserId;

        if (call.callerId === currentUserId) {
          targetUserId = call.receiverId;
        } else if (call.receiverId === currentUserId) {
          targetUserId = call.callerId;
        } else {
          return;
        }

        io.to(targetUserId).emit("call:ice-candidate", {
          callId,
          candidate,
        });

      } catch (error) {
        console.error("ICE candidate error:", error);
      }
    }
  );

  // ==========================================
  // 7. END CALL
  // ==========================================

  socket.on("call:end", ({ callId } = {}) => {
    try {
      const call = activeCalls.get(callId);

      if (
        !call ||
        ![
          call.callerId,
          call.receiverId,
        ].includes(currentUserId)
      ) {
        return;
      }

      const otherUserId =
        call.callerId === currentUserId
          ? call.receiverId
          : call.callerId;

      io.to(otherUserId).emit("call:ended", {
        callId,
        endedBy: currentUserId,
        reason: "user_ended",
      });

      removeCall(callId);

      console.log("Call ended:", callId);

    } catch (error) {
      console.error("Call end error:", error);
    }
  });

  // ==========================================
  // 8. DISCONNECT CLEANUP
  // ==========================================

  socket.on("disconnect", async () => {
    try {
      // Check if another socket of this user exists
      const remainingSockets = await io
        .in(currentUserId)
        .fetchSockets();

      // Another tab/device is still connected
      if (remainingSockets.length > 0) {
        return;
      }

      const callId = userActiveCalls.get(currentUserId);

      if (!callId) return;

      const call = activeCalls.get(callId);

      if (!call) return;

      const otherUserId =
        call.callerId === currentUserId
          ? call.receiverId
          : call.callerId;

      io.to(otherUserId).emit("call:ended", {
        callId,
        endedBy: currentUserId,
        reason: "participant_disconnected",
      });

      removeCall(callId);

      console.log(
        "Call cleaned after disconnect:",
        callId
      );

    } catch (error) {
      console.error("Call disconnect cleanup error:", error);
    }
  });
};

export default callSocket;
