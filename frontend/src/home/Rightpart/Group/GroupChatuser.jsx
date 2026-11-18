import React, { useState } from "react";
import useConversation from "../../../zustand/useConversation.js";
import { useSocketContext } from "../../../context/SocketContext.jsx";
import { CiMenuFries } from "react-icons/ci";
import GroupInfo from "./GroupInfo/GroupInfo.jsx";
import GroupCallButtons from "../../../components/groupCall/GroupCallButtons.jsx";

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
    <div className="relative z-40 flex h-[8vh] items-center justify-center gap-4 rounded-md bg-slate-800">
      <label
        htmlFor="my-drawer-2"
        className="btn btn-ghost drawer-button absolute left-5 z-10 lg:hidden"
      >
        <CiMenuFries className="text-xl text-white" />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setShowGroupInfo(true)}
          title="Open Group Info"
          className="relative z-10 flex h-14 w-14 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-green-600 text-2xl font-semibold text-white transition hover:bg-green-700"
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

        <button
          type="button"
          onClick={() => setShowGroupInfo(true)}
          className="relative z-10 cursor-pointer text-left hover:opacity-80"
        >
          <h1 className="text-xl font-semibold">{selectedGroup.groupName}</h1>
          {typingText ? (
            <span className="text-sm text-green-400">{typingText}</span>
          ) : (
            <span className="text-sm text-gray-400">
              {selectedGroup.members?.length || 0} Members
            </span>
          )}
        </button>
      </div>

      <GroupCallButtons groupId={selectedGroup._id} />

      {showGroupInfo && (
        <div className="absolute right-0 top-full z-[100] h-[75vh] w-full overflow-hidden rounded-lg border border-slate-700 shadow-2xl sm:w-[380px]">
          <GroupInfo onClose={() => setShowGroupInfo(false)} />
        </div>
      )}
    </div>
  );
}

export default GroupChatuser;
