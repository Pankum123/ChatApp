
import { useEffect, useRef } from "react";
import { useCallContext } from "../context/CallContext";
import useWebRTC from "../hooks/useWebRTC";

const CallWindow = () => {
  const {
    call,
    acceptCall,
    rejectCall,
    endCall,
    clearCallState,
  } = useCallContext();

  const {
    localStream,
    remoteStream,
    mediaError,
    isAudioEnabled,
    isVideoEnabled,
    startLocalMedia,
    toggleAudio,
    toggleVideo,
    closePeerConnection,
    connectionState,
  } = useWebRTC();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const startedCallRef = useRef(null);

  useEffect(() => {
    if (
      !call?.callId ||
      call.status !== "connecting" ||
      startedCallRef.current === call.callId
    ) {
      return;
    }

    startedCallRef.current = call.callId;

    startLocalMedia().then((stream) => {
      if (!stream) {
        startedCallRef.current = null;
      }
    });
  }, [call?.callId, call?.status, startLocalMedia]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (!remoteStream) return;

    if (call?.callType === "video" && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }

    if (call?.callType === "audio" && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, call?.callType]);

  useEffect(() => {
    if (
      call &&
      ["ended", "rejected", "timeout", "error", "busy", "unavailable"].includes(
        call.status
      )
    ) {
      closePeerConnection();
      startedCallRef.current = null;
    }
  }, [call?.status, closePeerConnection]);

  if (!call) return null;

  const handleEndCall = () => {
    endCall();
    closePeerConnection();
    startedCallRef.current = null;
  };

  const handleClose = () => {
    closePeerConnection();
    startedCallRef.current = null;
    clearCallState();
  };

  const isIncoming =
    call.role === "receiver" && call.status === "ringing";

  const isOutgoing =
    call.role === "caller" && call.status === "ringing";

  const isFinished = [
    "ended",
    "rejected",
    "timeout",
    "error",
    "busy",
    "unavailable",
  ].includes(call.status);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-gray-900 text-white shadow-2xl">

        <div className="flex items-center justify-between border-b border-gray-700 p-4">
          <div>
            <h2 className="text-lg font-semibold">
              {call.callType === "video" ? "Video Call" : "Audio Call"}
            </h2>

            <p className="text-sm text-gray-400">
              {call.status === "connecting"
                ? "Connecting..."
                : call.status === "ringing"
                ? "Ringing..."
                : call.status === "ended"
                ? "Call ended"
                : call.status === "rejected"
                ? "Call rejected"
                : call.status === "timeout"
                ? "Call not answered"
                : call.status === "busy"
                ? "User is busy"
                : call.status === "unavailable"
                ? "User is unavailable"
                : call.status === "error"
                ? "Call error"
                : connectionState}
            </p>
          </div>

          <button
            onClick={handleClose}
            className="rounded-full px-3 py-1 text-xl hover:bg-gray-700"
          >
            ×
          </button>
        </div>

        {isIncoming && (
          <div className="flex flex-col items-center gap-5 p-10">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-600 text-4xl">
              {call.callType === "video" ? "📹" : "📞"}
            </div>

            <h3 className="text-xl font-semibold">
              Incoming {call.callType} call
            </h3>

            <div className="flex gap-5">
              <button
                onClick={rejectCall}
                className="rounded-full bg-red-600 px-6 py-3 font-semibold hover:bg-red-700"
              >
                Reject
              </button>

              <button
                onClick={acceptCall}
                className="rounded-full bg-green-600 px-6 py-3 font-semibold hover:bg-green-700"
              >
                Accept
              </button>
            </div>
          </div>
        )}

        {isOutgoing && (
          <div className="flex flex-col items-center gap-5 p-10">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-600 text-4xl">
              📞
            </div>

            <h3 className="text-xl font-semibold">Calling...</h3>

            <button
              onClick={handleEndCall}
              className="rounded-full bg-red-600 px-8 py-3 font-semibold hover:bg-red-700"
            >
              Cancel Call
            </button>
          </div>
        )}

        {call.status === "connecting" && (
          <div className="p-4">
            {call.callType === "video" ? (
              <div className="relative min-h-[350px] overflow-hidden rounded-xl bg-black">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="h-[350px] w-full object-cover"
                />

                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="absolute bottom-4 right-4 h-28 w-40 rounded-xl border-2 border-white bg-gray-800 object-cover"
                />
              </div>
            ) : (
              <div className="flex min-h-[250px] flex-col items-center justify-center gap-4 rounded-xl bg-gray-800">
                <div className="text-6xl">📞</div>
                <p className="text-lg">Audio call in progress</p>
                <audio ref={remoteAudioRef} autoPlay />
              </div>
            )}

            {mediaError && (
              <p className="mt-3 text-center text-sm text-red-400">
                {mediaError}
              </p>
            )}

            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                onClick={toggleAudio}
                className={`rounded-full px-5 py-3 ${
                  isAudioEnabled ? "bg-gray-700" : "bg-red-600"
                }`}
              >
                {isAudioEnabled ? "Mic On" : "Mic Off"}
              </button>

              {call.callType === "video" && (
                <button
                  onClick={toggleVideo}
                  className={`rounded-full px-5 py-3 ${
                    isVideoEnabled ? "bg-gray-700" : "bg-red-600"
                  }`}
                >
                  {isVideoEnabled ? "Camera On" : "Camera Off"}
                </button>
              )}

              <button
                onClick={handleEndCall}
                className="rounded-full bg-red-600 px-6 py-3 font-semibold hover:bg-red-700"
              >
                End Call
              </button>
            </div>
          </div>
        )}

        {isFinished && (
          <div className="flex flex-col items-center gap-5 p-10">
            <h3 className="text-xl font-semibold">
              {call.status === "ended"
                ? "Call Ended"
                : call.status === "rejected"
                ? "Call Rejected"
                : call.status === "timeout"
                ? "No Answer"
                : call.status === "busy"
                ? "User Busy"
                : call.status === "unavailable"
                ? "User Unavailable"
                : "Something went wrong"}
            </h3>

            {call.error && (
              <p className="text-sm text-red-400">{call.error}</p>
            )}

            <button
              onClick={handleClose}
              className="rounded-lg bg-blue-600 px-6 py-3 hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallWindow;
