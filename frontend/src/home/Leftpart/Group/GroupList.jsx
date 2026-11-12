
import React from "react";
import GroupItem from "./GroupItem";

function GroupList({
  groups = [],
  onGroupSelect,
  selectedGroupId,
}) {
  return (
    <div className="py-2">

      {groups.length > 0 ? (
        groups.map((group) => (
          <GroupItem
            key={group._id}
            group={group}
            onGroupSelect={onGroupSelect}
            isSelected={selectedGroupId === group._id}
          />
        ))
      ) : (
        <p className="text-center text-sm text-gray-400 py-5">
          No groups available
        </p>
      )}

    </div>
  );
}

export default GroupList;
