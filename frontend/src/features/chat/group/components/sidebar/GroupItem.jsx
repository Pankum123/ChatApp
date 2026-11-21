import React from "react";
import useConversation from "../../../../../shared/zustand/useConversation.js";
import { useSocketContext } from "../../../../../shared/realtime/SocketContext.jsx";

function GroupItem({ group }) {
  const { selectedGroup, setSelectedGroup } = useConversation();
  const { groupTypingUsers } = useSocketContext();

  const isSelected = selectedGroup?._id === group._id;

  const typingMembers = groupTypingUsers
    .filter((item) => item.groupId === group._id)
    .map((item) => {
      const member = group.members?.find(
        (member) => (member._id || member).toString() === item.senderId
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

  return (
    <div
      onClick={() => setSelectedGroup(group)}
      className={`hover:bg-slate-600 duration-300 ${
        isSelected ? "bg-slate-700" : ""
      }`}
    >
      <div className="flex space-x-4 px-8 py-3 hover:bg-slate-700 duration-300 cursor-pointer">

        {/* Group Avatar */}
        <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-lg overflow-hidden">
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
        <div className="min-w-0">
          <h1 className="font-bold text-white">
            {group.groupName}
          </h1>

          {typingText ? (
            <span className="text-xs text-green-400">
              {typingText}
            </span>
          ) : (
            <span className="text-xs text-gray-400">
              {group.members?.length || 0} members
            </span>
          )}
        </div>

      </div>
    </div>
  );
}

export default GroupItem;
