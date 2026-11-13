
import React, { useState } from "react";
import { leaveGroupAPI } from "../../../../api.js";
import useConversation from "../../../../zustand/useConversation.js";

function LeaveGroup({ group, onLeaveSuccess }) {
  const [leaving, setLeaving] = useState(false);
  const { setSelectedGroup } = useConversation();

  const handleLeaveGroup = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to leave "${group.groupName}"?`
    );

    if (!confirmed) return;

    try {
      setLeaving(true);

      await leaveGroupAPI(group._id);

      setSelectedGroup(null);

      alert("You left the group successfully!");

      if (onLeaveSuccess) {
        onLeaveSuccess();
      }
    } catch (error) {
      console.log(
        "Leave Group Error:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
        "Failed to leave group"
      );
    } finally {
      setLeaving(false);
    }
  };

  return (
    <div className="p-4">
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
        <h3 className="text-red-400 font-semibold text-lg">
          Leave Group
        </h3>

        <p className="text-gray-300 text-sm mt-2">
          Are you sure you want to leave this group?
          You will no longer receive group messages.
        </p>

        <button
          type="button"
          onClick={handleLeaveGroup}
          disabled={leaving}
          className="w-full mt-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 rounded-md"
        >
          {leaving ? "Leaving..." : "Leave Group"}
        </button>
      </div>
    </div>
  );
}

export default LeaveGroup;
