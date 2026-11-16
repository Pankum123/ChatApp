import React, { useState, useRef, useEffect } from "react";
import {
  MdDone,
  MdDoneAll,
  MdKeyboardArrowDown,
} from "react-icons/md";
import useConversation from "../../zustand/useConversation.js";
import {
  deleteMessageForMeAPI,
  deleteMessageForEveryoneAPI,
} from "../../api.js";

function Message({ message }) {
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  const menuRef = useRef(null);

  const authUser = JSON.parse(localStorage.getItem("ChatApp"));
  const userId = authUser?.user?._id;

  const { messages, setMessage } = useConversation();

  const senderId = message.senderId?._id || message.senderId;
  const itsMe = String(senderId) === String(userId);

  const chatName = itsMe ? "chat-end" : "chat-start";
  const chatColor = itsMe ? "bg-blue-500" : "";

  const createdAt = new Date(message.createdAt);
  const formattedTime = createdAt.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Close menu on outside click
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  // Delete for me
  const handleDeleteForMe = async () => {
    try {
      setLoading(true);

      await deleteMessageForMeAPI(message._id);

      setMessage(
        messages.filter((item) => item._id !== message._id)
      );

      setShowMenu(false);
    } catch (error) {
      console.log("Delete for me error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Delete for everyone
  const handleDeleteForEveryone = async () => {
    try {
      setLoading(true);

      const response = await deleteMessageForEveryoneAPI(message._id);
      const deletedMessage = response.data.deletedMessage;

      setMessage(
        messages.map((item) =>
          item._id === message._id
            ? { ...item, ...deletedMessage }
            : item
        )
      );

      setShowMenu(false);
    } catch (error) {
      console.log("Delete for everyone error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="p-4">
        <div className={`chat ${chatName}`}>
          <div
            className="relative group inline-block w-fit min-w-[65px] max-w-[85vw]"
            ref={menuRef}
          >
            <div
              className={`chat-bubble !w-fit !min-w-[65px] !max-w-[85vw] relative inline-block text-white pr-8 break-words ${chatColor} ${
                message.isDeleted ? "italic text-gray-300" : ""
              }`}
            >
              <span className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                {message.message}
              </span>

              {!loading && (
                <button
                  type="button"
                  onClick={() => setShowMenu((prev) => !prev)}
                  title="Message options"
                  className="
                    absolute top-1 right-1 p-0.5 rounded-full
                    text-white bg-black/20 hover:bg-black/40
                    opacity-100 sm:opacity-0
                    sm:group-hover:opacity-100
                    sm:group-focus-within:opacity-100
                    transition-opacity duration-150
                  "
                >
                  <MdKeyboardArrowDown size={21} />
                </button>
              )}
            </div>

            {showMenu && (
              <div
                className={`absolute top-full mt-1 z-50 w-48 rounded-md bg-slate-800 shadow-xl border border-slate-600 ${
                  itsMe ? "right-0" : "left-0"
                }`}
              >
                <button
                  type="button"
                  onClick={handleDeleteForMe}
                  disabled={loading}
                  className="block w-full text-left px-4 py-3 text-white hover:bg-slate-700"
                >
                  Delete for me
                </button>

                {itsMe && !message.isDeleted && (
                  <button
                    type="button"
                    onClick={handleDeleteForEveryone}
                    disabled={loading}
                    className="block w-full text-left px-4 py-3 text-white hover:bg-slate-700"
                  >
                    Delete for everyone
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="chat-footer">
            {formattedTime}

            {!message.isDeleted && itsMe && message.status === "sent" && (
              <MdDone className="text-gray-400 text-base" />
            )}

            {!message.isDeleted && itsMe && message.status === "delivered" && (
              <MdDoneAll className="text-gray-400 text-base" />
            )}

            {!message.isDeleted && itsMe && message.status === "read" && (
              <MdDoneAll className="text-blue-400 text-base" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Message;
