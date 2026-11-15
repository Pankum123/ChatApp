import React from "react";
import useConversation from "../../zustand/useConversation.js";
import { useSocketContext } from "../../context/SocketContext.jsx";
import profile from "../../../public/user.jpg";

function User({ user }) {
  const { selectedConversation, setSelectedConversation } = useConversation();

  const isSelected = selectedConversation?._id === user._id;

  const { onlineUsers } = useSocketContext();
  const isOnline = onlineUsers.includes(user._id);

  return (
    <div
      className={`hover:bg-slate-600 duration-300 ${
        isSelected ? "bg-slate-700" : ""
      }`}
      onClick={() => setSelectedConversation(user)}
    >
      <div className="flex space-x-4 px-8 py-3 hover:bg-slate-700 duration-300 cursor-pointer">

        {/* Profile Image */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full overflow-hidden">
            <img
              src={user?.profilePic?.url || profile}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Online / Offline Indicator */}
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-800 ${
              isOnline ? "bg-green-500" : "bg-gray-500"
            }`}
          />
        </div>

        {/* User Name and Status */}
        <div className="flex flex-col justify-center">
          <h1 className="font-bold text-white">
            {user.fullname}
          </h1>

          <span className="text-xs text-gray-400">
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>

      </div>
    </div>
  );
}

export default User;

