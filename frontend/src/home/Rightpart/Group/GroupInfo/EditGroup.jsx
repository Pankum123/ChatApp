
import React, { useState } from "react";
import { editGroupAPI } from "../../../../api.js";
import useConversation from "../../../../zustand/useConversation.js";

function EditGroup({ group, isAdmin }) {
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(group.groupName || "");
  const [saving, setSaving] = useState(false);

  const { setSelectedGroup } = useConversation();

  const handleSave = async () => {
    const trimmedName = groupName.trim();

    if (!trimmedName) {
      alert("Group name cannot be empty");
      return;
    }

    if (trimmedName.length > 50) {
      alert("Group name cannot exceed 50 characters");
      return;
    }

    if (trimmedName === group.groupName) {
      setIsEditing(false);
      return;
    }

    try {
      setSaving(true);

      const response = await editGroupAPI(group._id, trimmedName);

      setSelectedGroup(response.data.group);
      setIsEditing(false);

      alert("Group name updated successfully!");
    } catch (error) {
      console.log(
        "Edit Group Error:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message || "Failed to update group name"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setGroupName(group.groupName || "");
    setIsEditing(false);
  };

  return (
    <div className="w-full max-w-xs text-center mt-3">

      {!isEditing ? (
        <button
          type="button"
          disabled={!isAdmin}
          onClick={() => setIsEditing(true)}
          className={`text-xl font-semibold ${
            isAdmin
              ? "cursor-pointer hover:text-green-400"
              : "cursor-default"
          }`}
          title={isAdmin ? "Click to edit group name" : group.groupName}
        >
          {group.groupName}
          {isAdmin && (
            <span className="text-sm text-gray-400 ml-2">✏️</span>
          )}
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            maxLength={50}
            placeholder="Enter group name"
            className="w-full px-3 py-2 rounded-md bg-slate-800 border border-green-500 text-white outline-none"
            autoFocus
          />

          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-md text-white"
            >
              {saving ? "Saving..." : "Save"}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-md text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default EditGroup;
