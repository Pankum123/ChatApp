import React from "react";
import useConversation from "../../../../../shared/zustand/useConversation.js";
import { useSocketContext } from "../../../../../shared/realtime/SocketContext.jsx";

function GroupItem({ group, onSelect }) {
  const { selectedGroup, setSelectedGroup } = useConversation();
  const { groupTypingUsers } = useSocketContext();

  const isSelected = selectedGroup?._id === group._id;

  const typingMembers = groupTypingUsers
    .filter((item) => item.groupId === group._id)
    .map((item) => {
      const member = group.members?.find(
        (member) =>
          (member._id || member).toString() === item.senderId
      );

      return member?.fullname;
    })
    .filter(Boolean);

  const typingText =
    typingMembers.length === 1
      ? `${typingMembers[0]} is typing...`
      : typingMembers.length > 1
      ? `${typingMembers.join(", ")} are typing...`
      : "";

  const lastMessage = group.lastMessage;

  const senderName =
    lastMessage?.senderId?.fullname || "Someone";

  const preview = lastMessage
    ? lastMessage.isDeleted
      ? "This message was deleted"
      : `${senderName}: ${
          lastMessage.message ||
          (lastMessage.attachments?.length ? "📎 Attachment" : "")
        }`
    : `${group.members?.length || 0} members`;

  const handleSelect = () => {
    setSelectedGroup(group);
    onSelect?.();
  };

  return (
    <div
      onClick={handleSelect}
      className={`duration-300 cursor-pointer ${
        isSelected ? "bg-slate-700" : "hover:bg-slate-700"
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">

        {/* Group Avatar */}
        <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-lg overflow-hidden flex-shrink-0">
          {group.groupImage?.url ? (
            <img
              src={group.groupImage.url}
              alt="Group"
              className="w-full h-full object-cover"
            />
          ) : (
            group.groupName?.charAt(0)?.toUpperCase() || "G"
          )}
        </div>

        {/* Group Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h1 className="font-semibold text-white truncate">
              {group.groupName}
            </h1>

            {lastMessage?.createdAt && (
              <span className="text-[10px] text-gray-400 flex-shrink-0">
                {new Date(lastMessage.createdAt).toLocaleTimeString(
                  [],
                  { hour: "2-digit", minute: "2-digit" }
                )}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 mt-1">
            <span
              className={`text-xs truncate ${
                typingText
                  ? "text-green-400 font-medium"
                  : "text-gray-400"
              }`}
            >
              {typingText || preview}
            </span>

            {group.unreadCount > 0 && (
              <span className="min-w-5 h-5 px-1 rounded-full bg-green-500 text-white text-[11px] font-semibold flex items-center justify-center flex-shrink-0">
                {group.unreadCount > 99 ? "99+" : group.unreadCount}
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default GroupItem;
