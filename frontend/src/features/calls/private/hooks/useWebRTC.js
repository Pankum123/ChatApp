
import { useCallback, useEffect, useRef, useState } from "react";
import { useCallContext } from "../context/CallContext";
import useMediaStream from "./useMediaStream";

const ICE_SERVERS = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

const useWebRTC = () => {
  const {
    call,
    remoteOffer,
    remoteAnswer,
    remoteIceCandidates,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
  } = useCallContext();

  const {
    localStream,
    mediaError,
    isAudioEnabled,
    isVideoEnabled,
    startMedia,
    stopMedia,
    toggleAudio,
    toggleVideo,
  } = useMediaStream();

  const [peerConnection, setPeerConnection] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionState, setConnectionState] = useState("new");
  const [iceConnectionState, setIceConnectionState] = useState("new");

  const peerConnectionRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);

  const processedCandidatesRef = useRef(0);
  const tracksAddedCallIdRef = useRef(null);
  const offerCreatedRef = useRef(null);
  const answerCreatedRef = useRef(null);

  // Create Peer Connection
  useEffect(() => {
    if (!call?.callId) return;

    const pc = new RTCPeerConnection(ICE_SERVERS);

    peerConnectionRef.current = pc;
    setPeerConnection(pc);
    setRemoteStream(null);

    setConnectionState(pc.connectionState);
    setIceConnectionState(pc.iceConnectionState);

    // Receive remote media
    pc.ontrack = (event) => {
      const [stream] = event.streams;

      if (stream) {
        setRemoteStream(stream);
      }
    };

    // Send ICE candidate to other user
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendIceCandidate(event.candidate.toJSON());
      }
    };

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
      setIceConnectionState(pc.iceConnectionState);
    };

    return () => {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      pc.oniceconnectionstatechange = null;

      pc.close();

      if (peerConnectionRef.current === pc) {
        peerConnectionRef.current = null;
      }

      pendingIceCandidatesRef.current = [];
      processedCandidatesRef.current = 0;
      tracksAddedCallIdRef.current = null;
      offerCreatedRef.current = null;
      answerCreatedRef.current = null;

      setPeerConnection(null);
      setRemoteStream(null);
      setConnectionState("new");
      setIceConnectionState("new");
    };
  }, [call?.callId]);

  // Start microphone/camera
  const startLocalMedia = useCallback(async () => {
    if (!call?.callType) return null;

    const stream = await startMedia(call.callType);

    return stream;
  }, [call?.callType, startMedia]);

  // Add local media tracks to Peer Connection
  useEffect(() => {
    const pc = peerConnectionRef.current;

    if (!pc || !localStream || !call?.callId) return;

    if (tracksAddedCallIdRef.current === call.callId) return;

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    tracksAddedCallIdRef.current = call.callId;
  }, [localStream, peerConnection, call?.callId]);

  // Add queued ICE candidates
  const flushPendingIceCandidates = async (pc) => {
    const candidates = [...pendingIceCandidatesRef.current];

    pendingIceCandidatesRef.current = [];

    for (const candidate of candidates) {
      try {
        await pc.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (error) {
        console.error("Queued ICE candidate error:", error);
      }
    }
  };

  // Caller creates Offer
  useEffect(() => {
    const createOffer = async () => {
      const pc = peerConnectionRef.current;

      if (
        !pc ||
        !localStream ||
        tracksAddedCallIdRef.current !== call?.callId ||
        !call?.callId ||
        call.role !== "caller" ||
        call.status !== "connecting" ||
        offerCreatedRef.current === call.callId
      ) {
        return;
      }

      try {
        offerCreatedRef.current = call.callId;

        const offer = await pc.createOffer();

        await pc.setLocalDescription(offer);

        sendOffer(offer);
      } catch (error) {
        offerCreatedRef.current = null;
        console.error("Create offer error:", error);
      }
    };

    createOffer();
  }, [call, localStream, peerConnection, sendOffer]);

  // Receiver creates Answer
  useEffect(() => {
    const createAnswer = async () => {
      const pc = peerConnectionRef.current;

      if (
        !pc ||
        !localStream ||
        tracksAddedCallIdRef.current !== call?.callId ||
        !remoteOffer ||
        !call?.callId ||
        call.role !== "receiver" ||
        call.status !== "connecting" ||
        answerCreatedRef.current === call.callId
      ) {
        return;
      }

      try {
        answerCreatedRef.current = call.callId;

        await pc.setRemoteDescription(
          new RTCSessionDescription(remoteOffer)
        );

        await flushPendingIceCandidates(pc);

        const answer = await pc.createAnswer();

        await pc.setLocalDescription(answer);

        sendAnswer(answer);
      } catch (error) {
        answerCreatedRef.current = null;
        console.error("Create answer error:", error);
      }
    };

    createAnswer();
  }, [remoteOffer, call, localStream, peerConnection, sendAnswer]);

  // Caller receives Answer
  useEffect(() => {
    const setAnswer = async () => {
      const pc = peerConnectionRef.current;

      if (
        !pc ||
        !remoteAnswer ||
        !pc.localDescription ||
        pc.remoteDescription
      ) {
        return;
      }

      try {
        await pc.setRemoteDescription(
          new RTCSessionDescription(remoteAnswer)
        );

        await flushPendingIceCandidates(pc);
      } catch (error) {
        console.error("Set remote answer error:", error);
      }
    };

    setAnswer();
  }, [remoteAnswer, peerConnection]);

  // Process ICE candidates
  useEffect(() => {
    const pc = peerConnectionRef.current;

    if (!pc || !remoteIceCandidates?.length) return;

    const processCandidates = async () => {
      while (
        processedCandidatesRef.current < remoteIceCandidates.length
      ) {
        const candidate =
          remoteIceCandidates[processedCandidatesRef.current];

        processedCandidatesRef.current += 1;

        if (!pc.remoteDescription) {
          pendingIceCandidatesRef.current.push(candidate);
          continue;
        }

        try {
          await pc.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch (error) {
          console.error("Add ICE candidate error:", error);
        }
      }
    };

    processCandidates();
  }, [remoteIceCandidates, peerConnection]);

  // Close Peer Connection
  const closePeerConnection = useCallback(() => {
    const pc = peerConnectionRef.current;

    if (pc) {
      pc.close();
      peerConnectionRef.current = null;
    }

    stopMedia();

    pendingIceCandidatesRef.current = [];
    processedCandidatesRef.current = 0;
    tracksAddedCallIdRef.current = null;
    offerCreatedRef.current = null;
    answerCreatedRef.current = null;

    setPeerConnection(null);
    setRemoteStream(null);
    setConnectionState("closed");
    setIceConnectionState("closed");
  }, [stopMedia]);

  return {
    peerConnection,
    localStream,
    remoteStream,

    mediaError,
    isAudioEnabled,
    isVideoEnabled,

    connectionState,
    iceConnectionState,

    startLocalMedia,
    stopMedia,
    toggleAudio,
    toggleVideo,
    closePeerConnection,
  };
};

export default useWebRTC;
