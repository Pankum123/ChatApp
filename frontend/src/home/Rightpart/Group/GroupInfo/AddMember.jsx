
import React, { useState } from "react";
import useGetAllUsers from "../../../../context/useGetAllUsers.jsx";
import useConversation from "../../../../zustand/useConversation.js";
import { addGroupMemberAPI } from "../../../../api.js";

function AddMember({ group, onBack }) {
  const [allUsers, loading] = useGetAllUsers();
  const { setSelectedGroup } = useConversation();

  const [addingId, setAddingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const existingMemberIds = group.members.map((member) =>
    String(member._id || member)
  );

  const availableUsers = allUsers.filter(
    (user) => !existingMemberIds.includes(String(user._id))
  );

  const handleAddMember = async (memberId) => {
    try {
      setAddingId(memberId);
      setError("");
      setSuccess("");

      const response = await addGroupMemberAPI(group._id, memberId);

      setSelectedGroup(response.data.group);

      setSuccess("Member added successfully!");

    } catch (error) {
      setError(
        error.response?.data?.error || "Unable to add member"
      );
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="p-4">

      <h3 className="text-gray-300 font-semibold mb-4">
        Select a user to add
      </h3>

      {error && (
        <p className="text-red-400 text-sm mb-3">{error}</p>
      )}

      {success && (
        <p className="text-green-400 text-sm mb-3">{success}</p>
      )}

      {loading ? (
        <p className="text-gray-400">Loading users...</p>
      ) : availableUsers.length === 0 ? (
        <p className="text-gray-400">
          No users available to add.
        </p>
      ) : (
        <div className="space-y-3">
          {availableUsers.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between gap-3 bg-slate-800 p-3 rounded-lg"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 shrink-0 rounded-full bg-green-600 flex items-center justify-center font-semibold">
                  {user.fullname?.charAt(0)?.toUpperCase() || "U"}
                </div>

                <span className="truncate">
                  {user.fullname}
                </span>
              </div>

              <button
                onClick={() => handleAddMember(user._id)}
                disabled={addingId !== null}
                className="px-3 py-1 rounded-md bg-green-600 hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                {addingId === user._id ? "Adding..." : "Add"}
              </button>
            </div>
          ))}
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

export default AddMember;
