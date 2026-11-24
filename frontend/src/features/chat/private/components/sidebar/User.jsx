import React from "react";
import useConversation from "../../../../../shared/zustand/useConversation.js";
import { useSocketContext } from "../../../../../shared/realtime/SocketContext.jsx";
import profile from "../../../../../../public/user.jpg";

function User({ user, onSelect }) {
  const { selectedConversation, setSelectedConversation } =
    useConversation();

  const { onlineUsers, typingUsers } = useSocketContext();

  const isSelected = selectedConversation?._id === user._id;
  const isOnline = onlineUsers.includes(user._id);
  const isTyping = typingUsers.includes(user._id);

  const lastMessage = user.lastMessage;

  const preview = lastMessage
    ? lastMessage.isDeleted
      ? "This message was deleted"
      : lastMessage.message ||
        (lastMessage.attachments?.length ? "📎 Attachment" : "")
    : isOnline
    ? "Online"
    : "Offline";

  const handleSelect = () => {
    setSelectedConversation(user);
    onSelect?.();
  };

  return (
    <div
      onClick={handleSelect}
      className={`duration-300 cursor-pointer ${
        isSelected ? "bg-slate-700" : "hover:bg-slate-700"
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">

        {/* Profile Image */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden">
            <img
              src={user?.profilePic?.url || profile}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>

          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-800 ${
              isOnline ? "bg-green-500" : "bg-gray-500"
            }`}
          />
        </div>

        {/* User Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h1 className="font-semibold text-white truncate">
              {user.fullname}
            </h1>

            {lastMessage?.createdAt && (
              <span className="text-[10px] text-gray-400 flex-shrink-0">
                {new Date(lastMessage.createdAt).toLocaleTimeString(
                  [],
                  { hour: "2-digit", minute: "2-digit" }
                )}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 mt-1">
            <span
              className={`text-xs truncate ${
                isTyping
                  ? "text-green-400 font-medium"
                  : "text-gray-400"
              }`}
            >
              {isTyping ? "Typing..." : preview}
            </span>

            {user.unreadCount > 0 && (
              <span className="min-w-5 h-5 px-1 rounded-full bg-green-500 text-white text-[11px] font-semibold flex items-center justify-center flex-shrink-0">
                {user.unreadCount > 99 ? "99+" : user.unreadCount}
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default User;
