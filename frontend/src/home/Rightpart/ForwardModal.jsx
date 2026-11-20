
import React, { useState } from "react";
import { MdClose } from "react-icons/md";
import { IoArrowRedo } from "react-icons/io5";

import useGetAllUsers from "../../context/useGetAllUsers.jsx";
import useGetGroups from "../../context/Group/useGetGroups.js";

import {
  forwardMessageAPI,
  forwardGroupMessageAPI,
} from "../../shared/api.js";

function ForwardModal({ message, sourceType = "private", onClose }) {
  const [allUsers, usersLoading] = useGetAllUsers();
  const [groups, groupsLoading] = useGetGroups();

  const [activeTab, setActiveTab] = useState("chats");
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [sending, setSending] = useState(false);

  const handleForward = async () => {
  if (!selectedDestination || !message?._id) return;

  try {
    setSending(true);

    if (selectedDestination.type === "private") {
      await forwardMessageAPI(
        selectedDestination.id,
        message._id,
        sourceType
      );
    } else {
      await forwardGroupMessageAPI(
        selectedDestination.id,
        message._id,
        sourceType
      );
    }

    onClose();
  } catch (error) {
    console.error("Forward error:", error);

    alert(
      error.response?.data?.error ||
      "Message forward nahi ho paya."
    );
  } finally {
    setSending(false);
  }
};

  const getGroupName = (group) =>
    group.groupName || group.name || "Unnamed Group";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-lg bg-[#202c33] text-white shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-600 px-4 py-3">
          <h2 className="text-lg font-semibold">
            Forward Message
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 hover:bg-[#374248]"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-600">
          <button
            type="button"
            onClick={() => {
              setActiveTab("chats");
              setSelectedDestination(null);
            }}
            className={`flex-1 py-3 ${
              activeTab === "chats"
                ? "border-b-2 border-green-500 text-green-400"
                : "text-gray-300"
            }`}
          >
            Private Chats
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("groups");
              setSelectedDestination(null);
            }}
            className={`flex-1 py-3 ${
              activeTab === "groups"
                ? "border-b-2 border-green-500 text-green-400"
                : "text-gray-300"
            }`}
          >
            Groups
          </button>
        </div>

        {/* Destination List */}
        <div className="max-h-80 overflow-y-auto p-2">

          {/* Private Chats */}
          {activeTab === "chats" && (
            <>
              {usersLoading ? (
                <p className="p-4 text-center text-gray-300">
                  Loading users...
                </p>
              ) : allUsers.length === 0 ? (
                <p className="p-4 text-center text-gray-400">
                  No users found
                </p>
              ) : (
                allUsers.map((user) => (
                  <button
                    type="button"
                    key={user._id}
                    onClick={() =>
                      setSelectedDestination({
                        type: "private",
                        id: user._id,
                        name: user.fullname,
                      })
                    }
                    className={`flex w-full items-center gap-3 rounded-md p-3 text-left hover:bg-[#374248] ${
                      selectedDestination?.id === user._id &&
                      selectedDestination?.type === "private"
                        ? "bg-[#374248]"
                        : ""
                    }`}
                  >
                    <img
                      src={
                        user.profilePic?.url ||
                        user.profilePic ||
                        user.avatar ||
                        "/user.jpg"
                      }
                      alt=""
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/user.jpg";
                      }}
                      className="h-11 w-11 rounded-full object-cover"
                    />

                    <span className="flex-1">
                      {user.fullname || "Unknown User"}
                    </span>

                    {selectedDestination?.id === user._id &&
                      selectedDestination?.type === "private" && (
                        <span className="text-green-400">✓</span>
                      )}
                  </button>
                ))
              )}
            </>
          )}

          {/* Groups */}
          {activeTab === "groups" && (
            <>
              {groupsLoading ? (
                <p className="p-4 text-center text-gray-300">
                  Loading groups...
                </p>
              ) : groups.length === 0 ? (
                <p className="p-4 text-center text-gray-400">
                  No groups found
                </p>
              ) : (
                groups.map((group) => (
                  <button
                    type="button"
                    key={group._id}
                    onClick={() =>
                      setSelectedDestination({
                        type: "group",
                        id: group._id,
                        name: getGroupName(group),
                      })
                    }
                    className={`flex w-full items-center gap-3 rounded-md p-3 text-left hover:bg-[#374248] ${
                      selectedDestination?.id === group._id &&
                      selectedDestination?.type === "group"
                        ? "bg-[#374248]"
                        : ""
                    }`}
                  >
                    <img
                      src={
                        group.groupImage?.url ||
                        group.groupImage ||
                        "/user.jpg"
                      }
                      alt=""
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/user.jpg";
                      }}
                      className="h-11 w-11 rounded-full object-cover"
                    />

                    <span className="flex-1">
                      {getGroupName(group)}
                    </span>

                    {selectedDestination?.id === group._id &&
                      selectedDestination?.type === "group" && (
                        <span className="text-green-400">✓</span>
                      )}
                  </button>
                ))
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-600 p-4">
          <span className="max-w-[65%] truncate text-sm text-gray-300">
            {selectedDestination
              ? `To: ${selectedDestination.name}`
              : "Select a destination"}
          </span>

          <button
            type="button"
            onClick={handleForward}
            disabled={!selectedDestination || sending}
            className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 font-medium hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <IoArrowRedo size={18} />

            {sending ? "Sending..." : "Forward"}
          </button>
        </div>

      </div>
    </div>
  );
}

export default ForwardModal;
