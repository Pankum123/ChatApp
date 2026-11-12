
import React from "react";

function GroupItem({ group, onGroupSelect, isSelected }) {
  return (
    <div
      onClick={() => onGroupSelect(group)}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-700 hover:bg-slate-700 transition-colors ${
        isSelected ? "bg-slate-700" : ""
      }`}
    >
      {/* Group Avatar */}
      <div className="w-11 h-11 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-lg">
        {group.groupName?.charAt(0)?.toUpperCase() || "G"}
      </div>

      {/* Group Details */}
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-medium truncate">
          {group.groupName}
        </h3>

        <p className="text-sm text-gray-400">
          {group.members?.length || 0} members
        </p>
      </div>
    </div>
  );
}

export default GroupItem;
