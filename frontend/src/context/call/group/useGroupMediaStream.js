import { useCallback, useEffect, useRef, useState } from "react";

const useGroupMediaStream = () => {
  const streamRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [mediaError, setMediaError] = useState("");
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const startMedia = useCallback(async (callType = "audio") => {
    try {
      setMediaError("");

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Camera/microphone access requires a supported browser and HTTPS (or localhost)."
        );
      }

      const existing = streamRef.current;
      if (existing) {
        const existingHasVideo = existing.getVideoTracks().length > 0;
        if (callType === "audio" || existingHasVideo) return existing;

        existing.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setLocalStream(null);
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video",
      });

      streamRef.current = stream;
      setLocalStream(stream);
      setIsAudioEnabled(true);
      setIsVideoEnabled(callType === "video");
      return stream;
    } catch (error) {
      console.error("Group call media error:", error);
      setMediaError(error?.message || "Unable to access camera or microphone.");
      return null;
    }
  }, []);

  const toggleAudio = useCallback(() => {
    const tracks = streamRef.current?.getAudioTracks() || [];
    if (!tracks.length) return;
    const enabled = !tracks[0].enabled;
    tracks.forEach((track) => {
      track.enabled = enabled;
    });
    setIsAudioEnabled(enabled);
  }, []);

  const toggleVideo = useCallback(() => {
    const tracks = streamRef.current?.getVideoTracks() || [];
    if (!tracks.length) return;
    const enabled = !tracks[0].enabled;
    tracks.forEach((track) => {
      track.enabled = enabled;
    });
    setIsVideoEnabled(enabled);
  }, []);

  const stopMedia = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setLocalStream(null);
    setIsAudioEnabled(true);
    setIsVideoEnabled(true);
    setMediaError("");
  }, []);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    },
    []
  );

  return {
    localStream,
    mediaError,
    isAudioEnabled,
    isVideoEnabled,
    startMedia,
    stopMedia,
    toggleAudio,
    toggleVideo,
  };
};

export default useGroupMediaStream;
