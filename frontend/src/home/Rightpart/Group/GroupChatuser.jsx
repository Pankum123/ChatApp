import React, { useState } from "react";
import useConversation from "../../../zustand/useConversation.js";
import { CiMenuFries } from "react-icons/ci";
import GroupInfo from "./GroupInfo/GroupInfo.jsx";

function GroupChatuser() {
  const { selectedGroup } = useConversation();
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  if (!selectedGroup) return null;

  return (
    <div className="relative z-40 flex items-center h-[8vh] justify-center gap-4 bg-slate-800 rounded-md">

      {/* Mobile Menu */}
      <label
        htmlFor="my-drawer-2"
        className="btn btn-ghost drawer-button lg:hidden absolute left-5 z-10"
      >
        <CiMenuFries className="text-white text-xl" />
      </label>

      {/* Group Profile */}
      <div className="flex items-center gap-3">

        {/* Group Avatar */}
        <button
          type="button"
          onClick={() => setShowGroupInfo(true)}
          title="Open Group Info"
          className="relative z-10 w-14 h-14 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-2xl overflow-hidden hover:bg-green-700 transition cursor-pointer"
        >
          {selectedGroup.groupImage?.url ? (
            <img
              src={selectedGroup.groupImage.url}
              alt="Group"
              className="w-full h-full object-cover"
            />
          ) : (
            selectedGroup.groupName?.charAt(0)?.toUpperCase() || "G"
          )}
        </button>

        {/* Group Details */}
        <button
          type="button"
          onClick={() => setShowGroupInfo(true)}
          className="relative z-10 text-left cursor-pointer hover:opacity-80"
        >
          <h1 className="text-xl font-semibold">
            {selectedGroup.groupName}
          </h1>

          <span className="text-sm text-gray-400">
            {selectedGroup.members?.length || 0} Members
          </span>
        </button>

      </div>

      {/* Group Info Panel */}
      {showGroupInfo && (
        <div className="absolute top-full right-0 z-[100] w-full sm:w-[380px] h-[75vh] shadow-2xl border border-slate-700 rounded-lg overflow-hidden">
          <GroupInfo
            onClose={() => setShowGroupInfo(false)}
          />
        </div>
      )}

    </div>
  );
}

export default GroupChatuser;
