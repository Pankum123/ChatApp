const GroupCallControls = ({
  callType,
  isAudioEnabled,
  isVideoEnabled,
  onToggleAudio,
  onToggleVideo,
  onLeave,
  isHost,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 border-t border-slate-700 px-4 py-4">
      <button
        type="button"
        onClick={onToggleAudio}
        className={`rounded-full px-5 py-3 font-medium ${
          isAudioEnabled ? "bg-slate-700" : "bg-red-600"
        }`}
      >
        {isAudioEnabled ? "Mic On" : "Mic Off"}
      </button>

      {callType === "video" && (
        <button
          type="button"
          onClick={onToggleVideo}
          className={`rounded-full px-5 py-3 font-medium ${
            isVideoEnabled ? "bg-slate-700" : "bg-red-600"
          }`}
        >
          {isVideoEnabled ? "Camera On" : "Camera Off"}
        </button>
      )}

      <button
        type="button"
        onClick={onLeave}
        className="rounded-full bg-red-600 px-6 py-3 font-semibold hover:bg-red-700"
      >
        {isHost ? "End Call for Everyone" : "Leave Call"}
      </button>
    </div>
  );
};

export default GroupCallControls;
