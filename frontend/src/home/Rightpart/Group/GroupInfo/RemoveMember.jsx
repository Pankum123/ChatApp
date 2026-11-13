
import React, { useState } from "react";
import useConversation from "../../../../zustand/useConversation.js";
import { removeGroupMemberAPI } from "../../../../api.js";

function RemoveMember({ group, onBack }) {
  const { setSelectedGroup } = useConversation();

  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const adminId = group.admin?._id || group.admin;

  const removableMembers = group.members.filter((member) => {
    const memberId = member._id || member;
    return String(memberId) !== String(adminId);
  });

  const handleRemoveMember = async (memberId) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this member?"
    );

    if (!confirmed) return;

    try {
      setRemovingId(memberId);
      setError("");
      setSuccess("");

      const response = await removeGroupMemberAPI(
        group._id,
        memberId
      );

      setSelectedGroup(response.data.group);

      setSuccess("Member removed successfully!");

    } catch (error) {
      setError(
        error.response?.data?.error || "Unable to remove member"
      );
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="p-4">

      <h3 className="text-gray-300 font-semibold mb-4">
        Select a member to remove
      </h3>

      {error && (
        <p className="text-red-400 text-sm mb-3">{error}</p>
      )}

      {success && (
        <p className="text-green-400 text-sm mb-3">{success}</p>
      )}

      {removableMembers.length === 0 ? (
        <p className="text-gray-400">
          No members available to remove.
        </p>
      ) : (
        <div className="space-y-3">
          {removableMembers.map((member) => {
            const memberId = member._id || member;

            return (
              <div
                key={memberId}
                className="flex items-center justify-between gap-3 bg-slate-800 p-3 rounded-lg"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-green-600 flex items-center justify-center font-semibold">
                    {member.fullname?.charAt(0)?.toUpperCase() || "U"}
                  </div>

                  <span className="truncate">
                    {member.fullname || "Group Member"}
                  </span>
                </div>

                <button
                  onClick={() => handleRemoveMember(memberId)}
                  disabled={removingId !== null}
                  className="px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-50 text-sm"
                >
                  {removingId === memberId ? "Removing..." : "Remove"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={onBack}
        className="mt-5 text-gray-400 hover:text-white"
      >
        ← Back
      </button>
    </div>
  );
}

export default RemoveMember;
