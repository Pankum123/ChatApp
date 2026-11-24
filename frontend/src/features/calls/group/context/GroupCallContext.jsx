import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { useSocketContext } from "../../../../shared/realtime/SocketContext";
import { useAuth } from "../../../auth/context/AuthProvider";

const GroupCallContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useGroupCallContext = () => useContext(GroupCallContext);

export const GroupCallProvider = ({ children }) => {
  const { socket } = useSocketContext();
  const [authUser] = useAuth();

  const currentUserId = authUser?.user?._id?.toString();

  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [signals, setSignals] = useState([]);
  const [error, setError] = useState("");

  const ringtoneRef = useRef(null);

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

  // Play ringtone
  const playRingtone = useCallback(() => {
    const ringtone = ringtoneRef.current;

    if (!ringtone) return;

    ringtone.currentTime = 0;

    ringtone.play().catch((error) => {
      console.warn("Group ringtone playback blocked:", error);
    });
  }, []);

  // Stop ringtone
  const stopRingtone = useCallback(() => {
    const ringtone = ringtoneRef.current;

    if (!ringtone) return;

    ringtone.pause();
    ringtone.currentTime = 0;
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleIncoming = (data) => {
      if (data.caller?.userId === currentUserId) return;

      stopRingtone();

      setIncomingCall(data);
      setError("");

      playRingtone();
    };

    const handleStarted = (data) => {
      stopRingtone();

      setIncomingCall(null);
      setSignals([]);

      setActiveCall({
        ...data,
        role: "host",
      });

      setError("");
    };

    const handleJoined = (data) => {
      stopRingtone();

      setIncomingCall(null);
      setSignals([]);

      setActiveCall({
        ...data,
        role: data.hostId === currentUserId ? "host" : "participant",
      });

      setError("");
    };

    const handleParticipantJoined = ({ callId, participant }) => {
      setActiveCall((previous) => {
        if (!previous || previous.callId !== callId) return previous;

        const exists = previous.participants.some(
          (item) => item.userId === participant.userId
        );

        if (exists) return previous;

        return {
          ...previous,
          participants: [...previous.participants, participant],
        };
      });
    };

    const handleParticipantLeft = ({ callId, userId, hostId }) => {
      setActiveCall((previous) => {
        if (!previous || previous.callId !== callId) return previous;

        return {
          ...previous,
          hostId: hostId || previous.hostId,
          role:
            (hostId || previous.hostId) === currentUserId
              ? "host"
              : "participant",
          participants: previous.participants.filter(
            (item) => item.userId !== userId
          ),
        };
      });
    };

    const handleSignal = (type) => (data) => {
      if (!data?.callId || !data?.fromUserId) return;

      setSignals((previous) => [
        ...previous,
        {
          id: `${data.callId}:${type}:${data.fromUserId}:${Date.now()}:${Math.random()}`,
          type,
          ...data,
        },
      ]);
    };

    const handleOffer = handleSignal("offer");
    const handleAnswer = handleSignal("answer");
    const handleIceCandidate = handleSignal("ice");

    const handleEnded = ({ callId }) => {
      stopRingtone();

      setActiveCall((previous) =>
        previous?.callId === callId ? null : previous
      );

      setIncomingCall((previous) =>
        previous?.callId === callId ? null : previous
      );

      setSignals([]);
    };

    const handleRejected = (data) => {
      setActiveCall((previous) => {
        if (!previous || previous.callId !== data.callId) return previous;

        return {
          ...previous,
          declinedUserIds: [
            ...(previous.declinedUserIds || []),
            data.userId,
          ],
        };
      });
    };

    const handleError = (data) => {
      stopRingtone();

      setError(data?.message || "Group call error.");
    };

    socket.on("group-call:incoming", handleIncoming);
    socket.on("group-call:started", handleStarted);
    socket.on("group-call:joined", handleJoined);
    socket.on("group-call:participant-joined", handleParticipantJoined);
    socket.on("group-call:participant-left", handleParticipantLeft);
    socket.on("group-call:offer", handleOffer);
    socket.on("group-call:answer", handleAnswer);
    socket.on("group-call:ice-candidate", handleIceCandidate);
    socket.on("group-call:ended", handleEnded);
    socket.on("group-call:rejected", handleRejected);
    socket.on("group-call:error", handleError);

    return () => {
      stopRingtone();

      socket.off("group-call:incoming", handleIncoming);
      socket.off("group-call:started", handleStarted);
      socket.off("group-call:joined", handleJoined);
      socket.off("group-call:participant-joined", handleParticipantJoined);
      socket.off("group-call:participant-left", handleParticipantLeft);
      socket.off("group-call:offer", handleOffer);
      socket.off("group-call:answer", handleAnswer);
      socket.off("group-call:ice-candidate", handleIceCandidate);
      socket.off("group-call:ended", handleEnded);
      socket.off("group-call:rejected", handleRejected);
      socket.off("group-call:error", handleError);
    };
  }, [socket, currentUserId, playRingtone, stopRingtone]);

  const startGroupCall = useCallback(
    (groupId, callType = "audio") => {
      if (!socket || !groupId || activeCall || incomingCall) return;

      setError("");
      socket.emit("group-call:start", { groupId, callType });
    },
    [socket, activeCall, incomingCall]
  );

  const joinGroupCall = useCallback(() => {
    if (!socket || !incomingCall?.callId) return;

    stopRingtone();

    socket.emit("group-call:join", {
      callId: incomingCall.callId,
    });
  }, [socket, incomingCall, stopRingtone]);

  const rejectGroupCall = useCallback(() => {
    if (!socket || !incomingCall?.callId) return;

    stopRingtone();

    socket.emit("group-call:reject", {
      callId: incomingCall.callId,
    });

    setIncomingCall(null);
  }, [socket, incomingCall, stopRingtone]);

  const leaveGroupCall = useCallback(() => {
    stopRingtone();

    if (!socket || !activeCall?.callId) {
      setActiveCall(null);
      return;
    }

    socket.emit("group-call:leave", {
      callId: activeCall.callId,
    });

    setActiveCall(null);
    setSignals([]);
  }, [socket, activeCall, stopRingtone]);

  const endGroupCall = useCallback(() => {
    stopRingtone();

    if (!socket || !activeCall?.callId) {
      setActiveCall(null);
      return;
    }

    if (activeCall.hostId === currentUserId) {
      socket.emit("group-call:end", {
        callId: activeCall.callId,
      });
    } else {
      socket.emit("group-call:leave", {
        callId: activeCall.callId,
      });
    }

    setActiveCall(null);
    setSignals([]);
  }, [socket, activeCall, currentUserId, stopRingtone]);

  const sendGroupSignal = useCallback(
    (eventName, targetUserId, payload) => {
      if (!socket || !activeCall?.callId || !targetUserId) return;

      socket.emit(eventName, {
        callId: activeCall.callId,
        targetUserId,
        ...payload,
      });
    },
    [socket, activeCall]
  );

  const consumeSignal = useCallback((signalId) => {
    setSignals((previous) =>
      previous.filter((signal) => signal.id !== signalId)
    );
  }, []);

  const clearGroupCallError = useCallback(() => setError(""), []);

  return (
    <GroupCallContext.Provider
      value={{
        currentUserId,
        incomingCall,
        activeCall,
        signals,
        error,
        startGroupCall,
        joinGroupCall,
        rejectGroupCall,
        leaveGroupCall,
        endGroupCall,
        sendGroupSignal,
        consumeSignal,
        clearGroupCallError,
      }}
    >
      {children}
    </GroupCallContext.Provider>
  );
};
