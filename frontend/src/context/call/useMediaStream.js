
import { useCallback, useEffect, useRef, useState } from "react";

const useMediaStream = () => {
  const [localStream, setLocalStream] = useState(null);
  const [mediaError, setMediaError] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const streamRef = useRef(null);

  // Start microphone and camera
  const startMedia = useCallback(async (callType = "audio") => {
    try {
      setMediaError(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Camera and microphone are not supported in this browser or require HTTPS."
        );
      }

      if (!["audio", "video"].includes(callType)) {
        throw new Error("Invalid call type.");
      }

      // Reuse existing stream if it matches requested call type
      const existingStream = streamRef.current;

      if (existingStream) {
        const hasVideo = existingStream.getVideoTracks().length > 0;

        if (callType === "audio" || hasVideo) {
          return existingStream;
        }

        // Restart stream if video is now required
        existingStream.getTracks().forEach((track) => track.stop());
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
      console.error("Media access error:", error);

      setMediaError(error.message || "Unable to access camera or microphone.");

      return null;
    }
  }, []);

  // Toggle microphone
  const toggleAudio = useCallback(() => {
    const stream = streamRef.current;

    if (!stream) return;

    const audioTracks = stream.getAudioTracks();

    if (!audioTracks.length) return;

    const nextEnabled = !audioTracks[0].enabled;

    audioTracks.forEach((track) => {
      track.enabled = nextEnabled;
    });

    setIsAudioEnabled(nextEnabled);
  }, []);

  // Toggle camera
  const toggleVideo = useCallback(() => {
    const stream = streamRef.current;

    if (!stream) return;

    const videoTracks = stream.getVideoTracks();

    if (!videoTracks.length) return;

    const nextEnabled = !videoTracks[0].enabled;

    videoTracks.forEach((track) => {
      track.enabled = nextEnabled;
    });

    setIsVideoEnabled(nextEnabled);
  }, []);

  // Stop all media tracks
  const stopMedia = useCallback(() => {
    const stream = streamRef.current;

    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    }

    streamRef.current = null;
    setLocalStream(null);

    setIsAudioEnabled(true);
    setIsVideoEnabled(true);
    setMediaError(null);
  }, []);

  // Cleanup when component using this hook unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });

        streamRef.current = null;
      }
    };
  }, []);

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

export default useMediaStream;
