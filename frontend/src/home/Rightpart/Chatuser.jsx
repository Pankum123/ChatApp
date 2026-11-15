import React, { useState } from "react";
import useConversation from "../../zustand/useConversation.js";
import { useSocketContext } from "../../context/SocketContext.jsx";
import { CiMenuFries } from "react-icons/ci";
import profile from "../../../public/user.jpg";
import UserProfile from "./UserProfile/UserProfile.jsx";

function Chatuser() {
  const { selectedConversation } = useConversation();
  const { onlineUsers, typingUsers } = useSocketContext();

  const [showProfile, setShowProfile] = useState(false);

  if (!selectedConversation) return null;

  const getOnlineUsersStatus = (userId) => {
    if (typingUsers.includes(userId)) {
      return "Typing...";
    }

    return onlineUsers.includes(userId) ? "Online" : "Offline";
  };

  const profilePic = selectedConversation?.profilePic?.url;

  return (
    <>
      <div className="relative flex items-center h-[8%] justify-center gap-4 bg-slate-800 hover:bg-slate-700 duration-300 rounded-md">

        {/* Mobile Menu Button */}
        <label
          htmlFor="my-drawer-2"
          className="btn btn-ghost drawer-button lg:hidden absolute left-5"
        >
          <CiMenuFries className="text-white text-xl" />
        </label>

        <div className="flex space-x-3 items-center justify-center h-[8vh] bg-gray-800 hover:bg-gray-700 duration-300">

          {/* Profile Image, Name and Status Click */}
          <button
            type="button"
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-3 cursor-pointer text-left"
            title="View Profile"
          >
            {/* Profile Image */}
            <div className="avatar">
              <div className="w-16 rounded-full">
                <img
                  src={profilePic || profile}
                  alt="Profile"
                  className="object-cover"
                />
              </div>
            </div>

            {/* User Name and Status */}
            <div>
              <h1 className="text-xl">
                {selectedConversation.fullname}
              </h1>

              <span
                className={`text-sm ${
                  typingUsers.includes(selectedConversation._id)
                    ? "text-green-400"
                    : "text-gray-400"
                }`}
              >
                {getOnlineUsersStatus(selectedConversation._id)}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* User Profile Popup */}
      {showProfile && (
        <UserProfile
          user={selectedConversation}
          onClose={() => setShowProfile(false)}
        />
      )}
    </>
  );
}

export default Chatuser;
