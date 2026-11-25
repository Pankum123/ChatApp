
import React, { useState } from "react";
import useConversation from "../../../../../shared/zustand/useConversation.js";
import { useSocketContext } from "../../../../../shared/realtime/SocketContext.jsx";
import { CiMenuFries } from "react-icons/ci";
import GroupInfo from "../info/GroupInfo.jsx";
import GroupCallButtons from "../../../../calls/group/components/GroupCallButtons.jsx";

function GroupChatuser() {
  const { selectedGroup } = useConversation();
  const { groupTypingUsers } = useSocketContext();

  const [showGroupInfo, setShowGroupInfo] = useState(false);

  if (!selectedGroup) return null;

  const typingMembers = groupTypingUsers
    .filter((item) => item.groupId === selectedGroup._id)
    .map((item) => {
      const member = selectedGroup.members?.find(
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
    <div className="relative z-40 flex h-16 w-full shrink-0 items-center gap-2 bg-slate-800 px-2 sm:px-4">

      {/* Mobile Menu Button */}
      <label
        htmlFor="my-drawer-2"
        className="btn btn-ghost drawer-button shrink-0 lg:hidden"
      >
        <CiMenuFries className="text-xl text-white" />
      </label>

      {/* Group Image */}
      <button
        type="button"
        onClick={() => setShowGroupInfo(true)}
        title="Open Group Info"
        className="flex h-10 w-10 sm:h-14 sm:w-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-green-600 text-xl sm:text-2xl font-semibold text-white transition hover:bg-green-700"
      >
        {selectedGroup.groupImage?.url ? (
          <img
            src={selectedGroup.groupImage.url}
            alt="Group"
            className="h-full w-full object-cover"
          />
        ) : (
          selectedGroup.groupName?.charAt(0)?.toUpperCase() || "G"
        )}
      </button>

      {/* Group Name and Members */}
      <button
        type="button"
        onClick={() => setShowGroupInfo(true)}
        className="min-w-0 flex-1 cursor-pointer text-left hover:opacity-80"
      >
        <h1 className="truncate text-base sm:text-xl font-semibold">
          {selectedGroup.groupName}
        </h1>

        <span className="block truncate text-xs sm:text-sm text-gray-400">
          {typingText || `${selectedGroup.members?.length || 0} Members`}
        </span>
      </button>

      {/* Group Call Buttons */}
      <div className="shrink-0">
        <GroupCallButtons groupId={selectedGroup._id} />
      </div>

      {/* Group Info Popup */}
      {showGroupInfo && (
        <div className="absolute right-0 top-full z-[100] h-[75vh] w-full overflow-hidden rounded-lg border border-slate-700 shadow-2xl sm:w-[380px]">
          <GroupInfo onClose={() => setShowGroupInfo(false)} />
        </div>
      )}
    </div>
  );
}

export default GroupChatuser;
