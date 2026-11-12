import React from "react";
import useConversation from "../../../zustand/useConversation.js";

function GroupItem({ group }) {
  const { selectedGroup, setSelectedGroup } = useConversation();

  // Check whether this group is selected
  const isSelected = selectedGroup?._id === group._id;

  return (
    <div
      onClick={() => setSelectedGroup(group)}
      className={`hover:bg-slate-600 duration-300 ${
        isSelected ? "bg-slate-700" : ""
      }`}
    >
      <div className="flex space-x-4 px-8 py-3 hover:bg-slate-700 duration-300 cursor-pointer">
        {/* Group Avatar */}
        <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-lg">
          {group.groupName?.charAt(0)?.toUpperCase() || "G"}
        </div>

        {/* Group Details */}
        <div>
          <h1 className="font-bold text-white">
            {group.groupName}
          </h1>

          <span className="text-gray-400">
            {group.members?.length || 0} members
          </span>
        </div>
      </div>
    </div>
  );
}

export default GroupItem;
