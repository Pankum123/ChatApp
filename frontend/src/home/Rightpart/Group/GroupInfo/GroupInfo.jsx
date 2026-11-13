import React, { useState } from "react";
import useConversation from "../../../../zustand/useConversation.js";
import AddMember from "./AddMember.jsx";
import RemoveMember from "./RemoveMember.jsx";
import Members from "./Members.jsx";
import DeleteGroup from "./DeleteGroup.jsx";
import LeaveGroup from "./LeaveGroup.jsx";
import EditGroup from "./EditGroup.jsx";

function GroupInfo({ onClose }) {
  const { selectedGroup } = useConversation();
  const [activeSection, setActiveSection] = useState("menu");

  if (!selectedGroup) return null;

  const authUser = JSON.parse(localStorage.getItem("ChatApp"));
  const currentUserId = authUser?.user?._id;

  const adminId =
    selectedGroup.admin?._id || selectedGroup.admin;

  const isAdmin =
    String(adminId) === String(currentUserId);

  const handleBack = () => setActiveSection("menu");

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
        <>
          <div className="flex flex-col items-center py-7">

            {/* Group Profile */}
            <div className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center text-3xl font-bold">
              {selectedGroup.groupName?.charAt(0)?.toUpperCase() || "G"}
            </div>

            {/* Editable Group Name */}
            <EditGroup
              group={selectedGroup}
              isAdmin={isAdmin}
            />

            {/* Member Count */}
            <p className="text-sm text-gray-400 mt-2">
              {selectedGroup.members?.length || 0} Members
            </p>

          </div>

          <div className="px-4 space-y-2">

            {/* Admin Options */}
            {isAdmin && (
              <>
                {/* Add Member */}
                <button
                  onClick={() => setActiveSection("add")}
                  className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-slate-800 text-left"
                >
                  <span className="text-green-400 text-xl">＋</span>
                  <span>Add Member</span>
                </button>

                {/* Remove Member */}
                <button
                  onClick={() => setActiveSection("remove")}
                  className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-slate-800 text-left"
                >
                  <span className="text-red-400 text-xl">－</span>
                  <span>Remove Member</span>
                </button>

                {/* Delete Group */}
                <button
                  onClick={() => setActiveSection("delete")}
                  className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-red-900/30 text-left"
                >
                  <span className="text-red-500 text-xl">🗑</span>
                  <span className="text-red-400">Delete Group</span>
                </button>
              </>
            )}

            {/* Members - Everyone */}
            <button
              onClick={() => setActiveSection("members")}
              className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-slate-800 text-left"
            >
              <span className="text-xl">👥</span>
              <span>Members</span>
            </button>

            {/* Leave Group - Only Normal Members */}
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
        </>
      )}

      {/* Selected Section */}
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
          <Members group={selectedGroup} />
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
    </div>
  );
}

export default GroupInfo;
