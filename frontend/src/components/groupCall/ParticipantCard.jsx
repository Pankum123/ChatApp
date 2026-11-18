import { useEffect, useRef } from "react";

const ParticipantCard = ({
  participant,
  stream,
  callType,
  isLocal = false,
}) => {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const hasVideo = Boolean(stream?.getVideoTracks?.().length);

  useEffect(() => {
    if (videoRef.current && stream && callType === "video") {
      videoRef.current.srcObject = stream;
    }
    if (audioRef.current && stream && callType === "audio") {
      audioRef.current.srcObject = stream;
    }
  }, [stream, callType]);

  const name = isLocal
    ? `${participant?.fullname || "You"} (You)`
    : participant?.fullname || "Participant";

  return (
    <div className="relative min-h-[170px] overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
      {callType === "video" && stream && hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="h-full min-h-[170px] w-full object-cover"
        />
      ) : (
        <div className="flex min-h-[170px] h-full flex-col items-center justify-center gap-3 p-4">
          {participant?.profilePic?.url ? (
            <img
              src={participant.profilePic.url}
              alt={name}
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600 text-3xl font-semibold">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          {callType === "audio" && stream && (
            <audio ref={audioRef} autoPlay />
          )}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-2 text-sm text-white">
        {name}
      </div>
    </div>
  );
};

export default ParticipantCard;
