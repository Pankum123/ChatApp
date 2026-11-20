import React, { useState, useRef } from "react";
import useConversation from "../../../../zustand/useConversation.js";
import { updateGroupImageAPI } from "../../../../shared/api.js";

import AddMember from "./AddMember.jsx";
import RemoveMember from "./RemoveMember.jsx";
import Members from "./Members.jsx";
import DeleteGroup from "./DeleteGroup.jsx";
import LeaveGroup from "./LeaveGroup.jsx";
import EditGroup from "./EditGroup.jsx";
import useGetAllUsers from "../../../../context/useGetAllUsers.jsx";

function GroupInfo({ onClose }) {
  const { selectedGroup, setSelectedGroup } = useConversation();
  const [allUsers] = useGetAllUsers();

  const [activeSection, setActiveSection] = useState("menu");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");

  const fileInputRef = useRef(null);

  if (!selectedGroup) return null;

  const authUser = JSON.parse(localStorage.getItem("ChatApp"));
  const currentUserId = authUser?.user?._id;
  const currentUser = authUser?.user;

  const memberUsers = [
    ...allUsers,
    ...(currentUser ? [currentUser] : []),
  ];

  const adminId =
    selectedGroup.admin?._id || selectedGroup.admin;

  const isAdmin =
    String(adminId) === String(currentUserId);

  const handleBack = () => setActiveSection("menu");

  // Change Group Image
  const handleImageChange = async (event) => {
    const image = event.target.files?.[0];

    if (!image) return;

    setImageError("");

    try {
      setUploadingImage(true);

      const response = await updateGroupImageAPI(
        selectedGroup._id,
        image
      );

      const updatedGroup = response.data.group;

      setSelectedGroup(updatedGroup);
      setImageError("");
    } catch (error) {
      console.log(
        "Group Image Upload Error:",
        error.response?.data || error.message
      );

      setImageError(
        error.response?.data?.errors || "Image upload failed"
      );
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  return (
    <div className="w-full h-full bg-slate-900 text-white flex flex-col">

      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-slate-800">
        {activeSection !== "menu" && (
          <button
            onClick={handleBack}
            className="text-xl hover:text-green-400"
          >
            ←
          </button>
        )}

        <h2 className="text-lg font-semibold flex-1">
          {activeSection === "menu" && "Group Info"}
          {activeSection === "add" && "Add Member"}
          {activeSection === "remove" && "Remove Member"}
          {activeSection === "members" && "Members"}
          {activeSection === "delete" && "Delete Group"}
          {activeSection === "leave" && "Leave Group"}
        </h2>

        {onClose && (
          <button
            onClick={onClose}
            className="text-xl hover:text-red-400"
          >
            ✕
          </button>
        )}
      </div>

      {/* Group Details */}
      {activeSection === "menu" && (
        <div className="flex-1 overflow-y-auto">

          <div className="flex flex-col items-center py-7">

            {/* Group Profile */}
            <div className="relative flex items-center justify-center">

              <div className="w-24 h-24 rounded-full overflow-hidden bg-green-600 flex items-center justify-center text-3xl font-bold">
                {selectedGroup.groupImage?.url ? (
                  <img
                    src={selectedGroup.groupImage.url}
                    alt="Group"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  selectedGroup.groupName?.charAt(0)?.toUpperCase() || "G"
                )}
              </div>

              {/* Edit Photo Icon */}
              <button
                type="button"
                disabled={uploadingImage}
                onClick={() => fileInputRef.current?.click()}
                className="absolute right-[-12px] bottom-1 bg-green-600 hover:bg-green-700 p-2 rounded-full text-white disabled:opacity-50"
                title="Change Group Photo"
              >
                {uploadingImage ? "..." : "✏️"}
              </button>

            </div>

            {/* Hidden Image Input */}
            <input
              type="file"
              accept="image/png,image/jpeg"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
            />

            {imageError && (
              <p className="text-red-400 text-sm mt-2">
                {imageError}
              </p>
            )}

            {/* Editable Group Name */}
            <EditGroup group={selectedGroup} />

            {/* Member Count */}
            <p className="text-sm text-gray-400 mt-2">
              {selectedGroup.members?.length || 0} Members
            </p>

          </div>

          <div className="px-4 space-y-2 pb-4">

            {/* Add Member */}
            {isAdmin && (
              <button
                onClick={() => setActiveSection("add")}
                className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-slate-800 text-left"
              >
                <span className="text-green-400 text-xl">＋</span>
                <span>Add Member</span>
              </button>
            )}

            {/* Remove Member */}
            {isAdmin && (
              <button
                onClick={() => setActiveSection("remove")}
                className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-slate-800 text-left"
              >
                <span className="text-red-400 text-xl">－</span>
                <span>Remove Member</span>
              </button>
            )}

            {/* Members - Everyone */}
            <button
              onClick={() => setActiveSection("members")}
              className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-slate-800 text-left"
            >
              <span className="text-xl">👥</span>
              <span>Members</span>
            </button>

            {/* Delete Group - Admin Only */}
            {isAdmin && (
              <button
                onClick={() => setActiveSection("delete")}
                className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-red-900/30 text-left"
              >
                <span className="text-red-500 text-xl">🗑</span>
                <span className="text-red-400">Delete Group</span>
              </button>
            )}

            {/* Leave Group - Normal Members */}
            {!isAdmin && (
              <button
                onClick={() => setActiveSection("leave")}
                className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-red-900/30 text-left"
              >
                <span className="text-red-500 text-xl">🚪</span>
                <span className="text-red-400">Leave Group</span>
              </button>
            )}

          </div>
        </div>
      )}

      {/* Selected Section */}
      {activeSection !== "menu" && (
        <div className="flex-1 overflow-y-auto">

          {activeSection === "add" && isAdmin && (
            <AddMember
              group={selectedGroup}
              onBack={handleBack}
            />
          )}

          {activeSection === "remove" && isAdmin && (
            <RemoveMember
              group={selectedGroup}
              onBack={handleBack}
            />
          )}

          {activeSection === "members" && (
            <Members
              group={selectedGroup}
              allUsers={memberUsers}
            />
          )}

          {activeSection === "delete" && isAdmin && (
            <DeleteGroup
              group={selectedGroup}
              onBack={handleBack}
            />
          )}

          {activeSection === "leave" && !isAdmin && (
            <LeaveGroup
              group={selectedGroup}
              onLeaveSuccess={() => onClose?.()}
            />
          )}

        </div>
      )}
    </div>
  );
}

export default GroupInfo;
