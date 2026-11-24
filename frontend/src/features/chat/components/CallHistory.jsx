
import React from "react";
import { MdCall, MdVideocam } from "react-icons/md";

function CallHistory({ call, currentUserId, isGroup = false }) {
  if (!call) return null;

  const isVideo = call.callType === "video";

  const hostOrCallerId = isGroup
    ? call.hostId
    : call.callerId;

  const isOutgoing =
    String(hostOrCallerId?._id || hostOrCallerId) ===
    String(currentUserId);

  const statusLabels = {
    completed: "Completed",
    missed: "Missed",
    rejected: "Rejected",
    cancelled: "Cancelled",
  };

  const statusColors = {
    completed: "text-green-400",
    missed: "text-red-400",
    rejected: "text-red-400",
    cancelled: "text-gray-400",
  };

  const formatDuration = (seconds = 0) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  const callDate = call.startedAt
    ? new Date(call.startedAt)
    : null;

  const formattedTime =
    callDate && !Number.isNaN(callDate.getTime())
      ? callDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  const status = statusLabels[call.status] || "Call";

  return (
    <div className="flex justify-center my-3 px-3">
      <div className="flex items-center gap-3 rounded-xl bg-[#202c33] border border-gray-700 px-4 py-3 min-w-[220px] max-w-[85%]">
        <div
          className={`rounded-full p-3 ${
            call.status === "missed" ||
            call.status === "rejected"
              ? "bg-red-500/20 text-red-400"
              : "bg-green-500/20 text-green-400"
          }`}
        >
          {isVideo ? (
            <MdVideocam size={23} />
          ) : (
            <MdCall size={23} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold">
            {isVideo ? "Video call" : "Audio call"}
          </p>

          <p
            className={`text-xs mt-1 ${
              statusColors[call.status] || "text-gray-400"
            }`}
          >
            {isGroup
              ? `${status} · ${call.participantIds?.length || 1} participants`
              : `${isOutgoing ? "Outgoing" : "Incoming"} · ${status}`}
          </p>

          {call.status === "completed" && (
            <p className="text-gray-400 text-xs mt-1">
              Duration: {formatDuration(call.duration)}
            </p>
          )}
        </div>

        {formattedTime && (
          <span className="text-gray-400 text-xs self-start">
            {formattedTime}
          </span>
        )}
      </div>
    </div>
  );
}

export default CallHistory;
