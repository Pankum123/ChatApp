import { useEffect, useRef } from "react";
import { useGroupCallContext } from "../context/GroupCallContext";
import useGroupMediaStream from "../hooks/useGroupMediaStream";
import useGroupWebRTC from "../hooks/useGroupWebRTC";
import ParticipantGrid from "./ParticipantGrid";
import GroupCallControls from "./GroupCallControls";

const GroupCallWindow = () => {
  const {
    currentUserId,
    incomingCall,
    activeCall,
    error,
    joinGroupCall,
    rejectGroupCall,
    endGroupCall,
    clearGroupCallError,
  } = useGroupCallContext();

  const {
    localStream,
    mediaError,
    isAudioEnabled,
    isVideoEnabled,
    startMedia,
    stopMedia,
    toggleAudio,
    toggleVideo,
  } = useGroupMediaStream();

  const { remoteStreams } = useGroupWebRTC(localStream);
  const startedCallRef = useRef(null);

  useEffect(() => {
    if (!activeCall?.callId || startedCallRef.current === activeCall.callId) {
      return;
    }

    startedCallRef.current = activeCall.callId;
    startMedia(activeCall.callType).then((stream) => {
      if (!stream) startedCallRef.current = null;
    });
  }, [activeCall?.callId, activeCall?.callType, startMedia]);

  useEffect(() => {
    if (!activeCall) {
      startedCallRef.current = null;
      stopMedia();
    }
  }, [activeCall, stopMedia]);

  const handleLeave = () => {
    endGroupCall();
    stopMedia();
    startedCallRef.current = null;
  };

  return (
    <>
      {incomingCall && !activeCall && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-7 text-center text-white shadow-2xl">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600 text-3xl">
              {incomingCall.callType === "video" ? "📹" : "📞"}
            </div>
            <h2 className="text-xl font-semibold">
              Incoming {incomingCall.callType} group call
            </h2>
            <p className="mt-2 text-slate-300">
              {incomingCall.caller?.fullname || "A group member"} is calling
              {" "}in {incomingCall.groupName || "a group"}.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <button
                type="button"
                onClick={rejectGroupCall}
                className="rounded-full bg-red-600 px-6 py-3 font-semibold"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={joinGroupCall}
                className="rounded-full bg-green-600 px-6 py-3 font-semibold"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}

      {activeCall && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 p-3 sm:p-6">
          <div className="flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {activeCall.groupName || "Group"}{" "}
                  {activeCall.callType === "video" ? "Video Call" : "Audio Call"}
                </h2>
                <p className="text-sm text-slate-400">
                  {activeCall.participants?.length || 1} participant(s)
                </p>
              </div>
              <button
                type="button"
                onClick={clearGroupCallError}
                className="rounded-full px-3 py-1 text-xl text-slate-300 hover:bg-slate-700"
                aria-label="Dismiss call message"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto p-4">
              <ParticipantGrid
                participants={activeCall.participants || []}
                currentUserId={currentUserId}
                localStream={localStream}
                remoteStreams={remoteStreams}
                callType={activeCall.callType}
              />

              {(mediaError || error) && (
                <p className="mt-3 text-center text-sm text-red-400">
                  {mediaError || error}
                </p>
              )}
            </div>

            <GroupCallControls
              callType={activeCall.callType}
              isAudioEnabled={isAudioEnabled}
              isVideoEnabled={isVideoEnabled}
              onToggleAudio={toggleAudio}
              onToggleVideo={toggleVideo}
              onLeave={handleLeave}
              isHost={activeCall.hostId === currentUserId}
            />
          </div>
        </div>
      )}

      {!activeCall && !incomingCall && error && (
        <div className="fixed bottom-5 right-5 z-[10001] max-w-sm rounded-lg bg-red-700 px-4 py-3 text-sm text-white shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <span>{error}</span>
            <button type="button" onClick={clearGroupCallError}>×</button>
          </div>
        </div>
      )}
    </>
  );
};

export default GroupCallWindow;
