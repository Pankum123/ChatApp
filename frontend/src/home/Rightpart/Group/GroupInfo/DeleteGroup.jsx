
import React, { useState } from "react";
import { deleteGroupAPI } from "../../../../api.js";

function DeleteGroup({ group, onBack }) {
  const [deleting, setDeleting] = useState(false);

  const handleDeleteGroup = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${group.groupName}"?`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);

      await deleteGroupAPI(group._id);

      alert("Group deleted successfully!");
      onBack();
    } catch (error) {
      console.log(
        "Delete Group Error:",
        error.response?.data || error.message
      );

      alert(error.response?.data?.message || "Failed to delete group");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-4">
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
        <h3 className="text-red-400 font-semibold text-lg">
          Delete Group
        </h3>

        <p className="text-gray-300 text-sm mt-2">
          Permanently delete this group and all its messages.
          This action cannot be undone.
        </p>

        <button
          type="button"
          onClick={handleDeleteGroup}
          disabled={deleting}
          className="w-full mt-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 rounded-md"
        >
          {deleting ? "Deleting..." : "Delete Group"}
        </button>
      </div>
    </div>
  );
}

export default DeleteGroup;
