
import React, { useState } from "react";

function CreateGroup({ allUsers = [], onClose, onCreate }) {
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  // Select / deselect members
  const handleMemberSelect = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Create group
  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedMembers.length === 0) {
      return;
    }

    onCreate({
      groupName: groupName.trim(),
      members: selectedMembers,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md mx-4 bg-white rounded-lg shadow-xl p-5">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-gray-800">
            New Group
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-gray-500 hover:text-red-500"
          >
            &times;
          </button>
        </div>

        {/* Group Name */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Group Name
          </label>

          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Members */}
        <div className="mb-5">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Add Members ({selectedMembers.length} selected)
          </h3>

          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">

            {allUsers.length > 0 ? (
              allUsers.map((user) => (
                <label
                  key={user._id}
                  className="flex items-center gap-3 px-3 py-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-100"
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(user._id)}
                    onChange={() => handleMemberSelect(user._id)}
                    className="w-4 h-4 accent-green-600"
                  />

                  <span className="text-gray-800">
                    {user.fullname}
                  </span>
                </label>
              ))
            ) : (
              <p className="py-5 text-center text-sm text-gray-500">
                No users available
              </p>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3">

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedMembers.length === 0}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Group
          </button>

        </div>
      </div>
    </div>
  );
}

export default CreateGroup;
