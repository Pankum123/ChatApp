import { useCallback, useEffect, useRef, useState } from "react";
import { useGroupCallContext } from "./GroupCallContext";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

const useGroupWebRTC = (localStream) => {
  const {
    currentUserId,
    activeCall,
    signals,
    sendGroupSignal,
    consumeSignal,
  } = useGroupCallContext();

  const peerConnectionsRef = useRef(new Map());
  const queuedIceRef = useRef(new Map());
  const offeredPeersRef = useRef(new Set());
  const processedSignalsRef = useRef(new Set());

  const [remoteStreams, setRemoteStreams] = useState({});
  const [connectionStates, setConnectionStates] = useState({});

  const createPeerConnection = useCallback(
    (remoteUserId) => {
      const existing = peerConnectionsRef.current.get(remoteUserId);
      if (existing) return existing;
      if (!localStream) return null;

      const pc = new RTCPeerConnection(ICE_SERVERS);

      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendGroupSignal(
            "group-call:ice-candidate",
            remoteUserId,
            { candidate: event.candidate.toJSON() }
          );
        }
      };

      pc.ontrack = (event) => {
        let stream = event.streams?.[0];

        if (!stream) {
          stream = new MediaStream();
          stream.addTrack(event.track);
        }

        setRemoteStreams((previous) => ({
          ...previous,
          [remoteUserId]: stream,
        }));
      };

      pc.onconnectionstatechange = () => {
        setConnectionStates((previous) => ({
          ...previous,
          [remoteUserId]: pc.connectionState,
        }));
      };

      peerConnectionsRef.current.set(remoteUserId, pc);
      setConnectionStates((previous) => ({
        ...previous,
        [remoteUserId]: pc.connectionState,
      }));

      return pc;
    },
    [localStream, sendGroupSignal]
  );

  const flushQueuedIce = useCallback(async (remoteUserId, pc) => {
    const queued = queuedIceRef.current.get(remoteUserId) || [];
    queuedIceRef.current.set(remoteUserId, []);

    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("Group call queued ICE error:", error);
      }
    }
  }, []);

  // Create one peer connection per other participant.
  // A stable ID comparison ensures only one side creates the offer.
  useEffect(() => {
    if (!activeCall || !localStream || !currentUserId) return;

    const participants = activeCall.participants || [];

    participants.forEach(async (participant) => {
      const remoteUserId = participant.userId;
      if (!remoteUserId || remoteUserId === currentUserId) return;

      const pc = createPeerConnection(remoteUserId);
      if (!pc) return;

      const shouldOffer =
        currentUserId.toLowerCase() < remoteUserId.toLowerCase();

      if (
        shouldOffer &&
        !offeredPeersRef.current.has(remoteUserId) &&
        pc.signalingState === "stable"
      ) {
        offeredPeersRef.current.add(remoteUserId);

        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendGroupSignal("group-call:offer", remoteUserId, {
            offer: pc.localDescription,
          });
        } catch (error) {
          offeredPeersRef.current.delete(remoteUserId);
          console.error("Group call offer error:", error);
        }
      }
    });

    const activeIds = new Set(
      participants
        .map((participant) => participant.userId)
        .filter((id) => id && id !== currentUserId)
    );

    for (const [remoteUserId, pc] of peerConnectionsRef.current.entries()) {
      if (!activeIds.has(remoteUserId)) {
        pc.close();
        peerConnectionsRef.current.delete(remoteUserId);
        queuedIceRef.current.delete(remoteUserId);
        offeredPeersRef.current.delete(remoteUserId);

        setRemoteStreams((previous) => {
          const next = { ...previous };
          delete next[remoteUserId];
          return next;
        });

        setConnectionStates((previous) => {
          const next = { ...previous };
          delete next[remoteUserId];
          return next;
        });
      }
    }
  }, [
    activeCall?.callId,
    activeCall?.participants,
    localStream,
    currentUserId,
    createPeerConnection,
    sendGroupSignal,
  ]);

  // Process incoming SDP and ICE signaling messages.
  useEffect(() => {
    if (!activeCall || !localStream) return;

    const processSignals = async () => {
      for (const signal of signals) {
        if (
          signal.callId !== activeCall.callId ||
          processedSignalsRef.current.has(signal.id)
        ) {
          continue;
        }

        const remoteUserId = signal.fromUserId;
        if (!remoteUserId || remoteUserId === currentUserId) {
          consumeSignal(signal.id);
          continue;
        }

        processedSignalsRef.current.add(signal.id);

        try {
          const pc = createPeerConnection(remoteUserId);
          if (!pc) {
            processedSignalsRef.current.delete(signal.id);
            continue;
          }

          if (signal.type === "offer" && signal.offer) {
            await pc.setRemoteDescription(
              new RTCSessionDescription(signal.offer)
            );
            await flushQueuedIce(remoteUserId, pc);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            sendGroupSignal("group-call:answer", remoteUserId, {
              answer: pc.localDescription,
            });
          }

          if (signal.type === "answer" && signal.answer) {
            if (!pc.remoteDescription) {
              await pc.setRemoteDescription(
                new RTCSessionDescription(signal.answer)
              );
              await flushQueuedIce(remoteUserId, pc);
            }
          }

          if (signal.type === "ice" && signal.candidate) {
            if (pc.remoteDescription) {
              await pc.addIceCandidate(
                new RTCIceCandidate(signal.candidate)
              );
            } else {
              const queued = queuedIceRef.current.get(remoteUserId) || [];
              queued.push(signal.candidate);
              queuedIceRef.current.set(remoteUserId, queued);
            }
          }

          consumeSignal(signal.id);
        } catch (error) {
          processedSignalsRef.current.delete(signal.id);
          console.error("Group call signaling error:", error);
          consumeSignal(signal.id);
        }
      }
    };

    processSignals();
  }, [
    signals,
    activeCall?.callId,
    localStream,
    currentUserId,
    createPeerConnection,
    flushQueuedIce,
    sendGroupSignal,
    consumeSignal,
  ]);

  // Close all peer connections when the group call ends/unmounts.
  useEffect(() => {
    if (activeCall?.callId) return undefined;

    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    queuedIceRef.current.clear();
    offeredPeersRef.current.clear();
    processedSignalsRef.current.clear();
    setRemoteStreams({});
    setConnectionStates({});
    return undefined;
  }, [activeCall?.callId]);

  return {
    remoteStreams,
    connectionStates,
  };
};

export default useGroupWebRTC;
