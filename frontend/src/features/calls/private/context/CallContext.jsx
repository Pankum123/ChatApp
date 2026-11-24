import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";

import { useSocketContext } from "../../../../shared/realtime/SocketContext";

const callContext = createContext(null);

// Custom hook
// eslint-disable-next-line react-refresh/only-export-components
export const useCallContext = () => {
  return useContext(callContext);
};

export const CallProvider = ({ children }) => {
  const { socket } = useSocketContext();

  const [call, setCall] = useState(null);

  const ringtoneRef = useRef(null);

  // WebRTC signaling data
  const [remoteOffer, setRemoteOffer] = useState(null);
  const [remoteAnswer, setRemoteAnswer] = useState(null);
  const [remoteIceCandidates, setRemoteIceCandidates] = useState([]);

  // Stop incoming ringtone
  const stopRingtone = () => {
    const ringtone = ringtoneRef.current;

    if (ringtone) {
      ringtone.pause();
      ringtone.currentTime = 0;
    }
  };

  // Play incoming ringtone
  const playRingtone = () => {
    const ringtone = ringtoneRef.current;

    if (!ringtone) return;

    ringtone.currentTime = 0;

    ringtone.play().catch((error) => {
      console.warn("Ringtone playback blocked:", error);
    });
  };

  // Initialize ringtone
  useEffect(() => {
    const ringtone = new Audio("/sounds/incoming-ringtone.mp3");

    ringtone.loop = true;
    ringtone.volume = 1;

    ringtoneRef.current = ringtone;

    return () => {
      ringtone.pause();
      ringtone.currentTime = 0;
      ringtoneRef.current = null;
    };
  }, []);

  // Reset call data
  const clearCallState = () => {
    stopRingtone();

    setCall(null);
    setRemoteOffer(null);
    setRemoteAnswer(null);
    setRemoteIceCandidates([]);
  };

  useEffect(() => {
    if (!socket) return;

    // Incoming call
    const handleIncomingCall = (data) => {
      stopRingtone();

      setCall({
        ...data,
        role: "receiver",
        status: "ringing",
      });

      setRemoteOffer(null);
      setRemoteAnswer(null);
      setRemoteIceCandidates([]);

      playRingtone();
    };

    // Outgoing call response
    const handleOutgoingCall = (data) => {
      stopRingtone();

      setCall({
        ...data,
        role: "caller",
        status: "ringing",
      });
    };

    // Call accepted
    const handleCallAccepted = (data) => {
      stopRingtone();

      setCall((prev) => {
        if (!prev) return prev;

        if (data.callId && prev.callId !== data.callId) {
          return prev;
        }

        return {
          ...prev,
          ...data,
          status: "connecting",
        };
      });
    };

    // Call rejected
    const handleCallRejected = (data) => {
      stopRingtone();

      setCall((prev) => {
        if (!prev) return prev;

        if (data.callId && prev.callId !== data.callId) {
          return prev;
        }

        return {
          ...prev,
          status: "rejected",
        };
      });
    };

    // Receiver is busy
    const handleCallBusy = (data) => {
      stopRingtone();

      setCall((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          ...data,
          status: "busy",
        };
      });
    };

    // Receiver unavailable
    const handleCallUnavailable = (data) => {
      stopRingtone();

      setCall((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          ...data,
          status: "unavailable",
        };
      });
    };

    // Ring timeout
    const handleCallTimeout = (data) => {
      stopRingtone();

      setCall((prev) => {
        if (!prev) return prev;

        if (data.callId && prev.callId !== data.callId) {
          return prev;
        }

        return {
          ...prev,
          status: "timeout",
        };
      });
    };

    // Call ended
    const handleCallEnded = (data) => {
      stopRingtone();

      setCall((prev) => {
        if (!prev) return prev;

        if (data.callId && prev.callId !== data.callId) {
          return prev;
        }

        return {
          ...prev,
          status: "ended",
        };
      });
    };

    // Backend error
    const handleCallError = (data) => {
      stopRingtone();

      setCall((prev) => ({
        ...(prev || {}),
        status: "error",
        error: data?.message || "Something went wrong",
      }));
    };

    // Receive WebRTC offer
    const handleOffer = (data) => {
      setRemoteOffer(data.offer);
    };

    // Receive WebRTC answer
    const handleAnswer = (data) => {
      setRemoteAnswer(data.answer);
    };

    // Receive ICE candidate
    const handleIceCandidate = (data) => {
      if (!data.candidate) return;

      setRemoteIceCandidates((prev) => [
        ...prev,
        data.candidate,
      ]);
    };

    // Register socket listeners
    socket.on("call:incoming", handleIncomingCall);
    socket.on("call:outgoing", handleOutgoingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("call:rejected", handleCallRejected);
    socket.on("call:busy", handleCallBusy);
    socket.on("call:unavailable", handleCallUnavailable);
    socket.on("call:timeout", handleCallTimeout);
    socket.on("call:ended", handleCallEnded);
    socket.on("call:error", handleCallError);

    socket.on("call:offer", handleOffer);
    socket.on("call:answer", handleAnswer);
    socket.on("call:ice-candidate", handleIceCandidate);

    // Cleanup
    return () => {
      stopRingtone();

      socket.off("call:incoming", handleIncomingCall);
      socket.off("call:outgoing", handleOutgoingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("call:rejected", handleCallRejected);
      socket.off("call:busy", handleCallBusy);
      socket.off("call:unavailable", handleCallUnavailable);
      socket.off("call:timeout", handleCallTimeout);
      socket.off("call:ended", handleCallEnded);
      socket.off("call:error", handleCallError);

      socket.off("call:offer", handleOffer);
      socket.off("call:answer", handleAnswer);
      socket.off("call:ice-candidate", handleIceCandidate);
    };
  }, [socket]);

  // Start audio/video call
  const startCall = (receiverId, callType = "audio") => {
    if (!socket || !receiverId) return;

    if (call) {
      console.warn("A call is already active.");
      return;
    }

    if (!["audio", "video"].includes(callType)) {
      console.error("Invalid call type");
      return;
    }

    setCall({
      receiverId,
      callType,
      role: "caller",
      status: "initiating",
    });

    setRemoteOffer(null);
    setRemoteAnswer(null);
    setRemoteIceCandidates([]);

    socket.emit("call:invite", {
      receiverId,
      callType,
    });
  };

  // Accept incoming call
  const acceptCall = () => {
    if (!socket || !call?.callId) return;

    stopRingtone();

    socket.emit("call:accept", {
      callId: call.callId,
    });

    setCall((prev) => ({
      ...prev,
      status: "connecting",
    }));
  };

  // Reject incoming call
  const rejectCall = () => {
    if (!socket || !call?.callId) return;

    stopRingtone();

    socket.emit("call:reject", {
      callId: call.callId,
    });

    setCall((prev) => ({
      ...prev,
      status: "rejected",
    }));
  };

  // Send WebRTC offer
  const sendOffer = (offer) => {
    if (!socket || !call?.callId || !offer) return;

    socket.emit("call:offer", {
      callId: call.callId,
      offer,
    });
  };

  // Send WebRTC answer
  const sendAnswer = (answer) => {
    if (!socket || !call?.callId || !answer) return;

    socket.emit("call:answer", {
      callId: call.callId,
      answer,
    });
  };

  // Send ICE candidate
  const sendIceCandidate = (candidate) => {
    if (!socket || !call?.callId || !candidate) return;

    socket.emit("call:ice-candidate", {
      callId: call.callId,
      candidate,
    });
  };

  // End current call
  const endCall = () => {
    stopRingtone();

    if (!socket || !call?.callId) {
      clearCallState();
      return;
    }

    socket.emit("call:end", {
      callId: call.callId,
    });

    setCall((prev) => ({
      ...prev,
      status: "ended",
    }));
  };

  return (
    <callContext.Provider
      value={{
        call,
        remoteOffer,
        remoteAnswer,
        remoteIceCandidates,

        startCall,
        acceptCall,
        rejectCall,
        endCall,
        clearCallState,

        sendOffer,
        sendAnswer,
        sendIceCandidate,
      }}
    >
      {children}
    </callContext.Provider>
  );
};
