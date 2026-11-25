import React, { useState } from "react";
import useConversation from "../../../../../shared/zustand/useConversation.js";
import { useSocketContext } from "../../../../../shared/realtime/SocketContext.jsx";
import { CiMenuFries } from "react-icons/ci";
import profile from "../../../../../../public/user.jpg";
import UserProfile from "../profile/UserProfile.jsx";
import CallButtons from "../../../../calls/private/components/CallButtons.jsx";

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
      <div className="flex h-16 w-full shrink-0 items-center gap-2 px-2 sm:px-4 bg-slate-800 hover:bg-slate-700 duration-300">

        {/* Mobile Menu Button */}
        <label
          htmlFor="my-drawer-2"
          className="btn btn-ghost drawer-button shrink-0 lg:hidden"
        >
          <CiMenuFries className="text-white text-xl" />
        </label>

        {/* User Profile */}
        <button
          type="button"
          onClick={() => setShowProfile(true)}
          className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 cursor-pointer text-left"
          title="View Profile"
        >
          <div className="avatar shrink-0">
            <div className="w-10 sm:w-14 rounded-full">
              <img
                src={profilePic || profile}
                alt="Profile"
                className="object-cover"
              />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base sm:text-xl font-semibold">
              {selectedConversation.fullname}
            </h1>

            <span
              className={`block truncate text-xs sm:text-sm ${
                typingUsers.includes(selectedConversation._id)
                  ? "text-green-400"
                  : "text-gray-400"
              }`}
            >
              {getOnlineUsersStatus(selectedConversation._id)}
            </span>
          </div>
        </button>

        {/* Audio and Video Call Buttons */}
        <div className="flex shrink-0 items-center">
          <CallButtons receiverId={selectedConversation._id} />
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
