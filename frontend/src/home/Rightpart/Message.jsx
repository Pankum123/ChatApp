import React, { useState, useRef, useEffect } from "react";
import {
  MdDone,
  MdDoneAll,
  MdKeyboardArrowDown,
  MdReply,
  MdContentCopy,
  MdEdit,
  MdDeleteOutline,
  MdArrowBack,
} from "react-icons/md";
import { IoArrowRedo } from "react-icons/io5";

import useConversation from "../../zustand/useConversation.js";

import {
  deleteMessageForMeAPI,
  deleteMessageForEveryoneAPI,
} from "../../api.js";

function Message({ message }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [menuPosition, setMenuPosition] = useState("bottom");
  const [copied, setCopied] = useState(false);

  const menuRef = useRef(null);

  const authUser = JSON.parse(localStorage.getItem("ChatApp"));
  const userId = authUser?.user?._id;

  const {
    messages,
    setMessage,
    setEditingMessage,
    setReplyingMessage,
  } = useConversation();

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
        setShowDeleteMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  // Open menu in available direction
  const handleMenuToggle = () => {
    if (!showMenu && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const menuHeight = 300;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
        setMenuPosition("top");
      } else {
        setMenuPosition("bottom");
      }
    }

    setShowMenu((prev) => !prev);
    setShowDeleteMenu(false);
  };

  // Delete for me
  const handleDeleteForMe = async () => {
    try {
      setLoading(true);

      await deleteMessageForMeAPI(message._id);

      setMessage(
        messages.filter((item) => item._id !== message._id)
      );

      setShowMenu(false);
      setShowDeleteMenu(false);
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
      setShowDeleteMenu(false);
    } catch (error) {
      console.log("Delete for everyone error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Edit message in Typesend input
  const handleEdit = () => {
    setEditingMessage(message);
    setShowMenu(false);
    setShowDeleteMenu(false);
  };

  // Copy private message
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.message);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
        setShowMenu(false);
        setShowDeleteMenu(false);
      }, 1000);
    } catch (error) {
      console.log("Copy message error:", error);
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
            {/* Message bubble */}
            <div
              id={`message-${message._id}`}
              className={`chat-bubble !w-fit !min-w-[65px] !max-w-[85vw] relative inline-block text-white pr-8 break-words ${chatColor} ${
                message.isDeleted ? "italic text-gray-300" : ""
              }`}
            >
              {/* Replied Message Preview */}
                {message.replyTo && (
                  <div
                    onClick={() => {
                      const originalMessage = document.getElementById(
                        `message-${message.replyTo._id}`
                      );

                      if (originalMessage) {
                        originalMessage.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });

                        originalMessage.classList.add("ring-2", "ring-green-400");

                        setTimeout(() => {
                          originalMessage.classList.remove(
                            "ring-2",
                            "ring-green-400"
                          );
                        }, 1500);
                      }
                    }}
                    className="bg-black/20 border-l-4 border-green-400 rounded-md px-3 py-2 mb-2 cursor-pointer hover:bg-black/30"
                  >
                    <p className="text-green-300 text-xs font-semibold mb-1">
                      {String(
                        message.replyTo.senderId?._id ||
                        message.replyTo.senderId
                      ) === String(userId)
                        ? "You"
                        : "Replied message"}
                    </p>

                    <p className="text-gray-200 text-sm break-words">
                      {message.replyTo.isDeleted
                        ? "This message was deleted"
                        : message.replyTo.message}
                    </p>
                  </div>
                )}

                <span className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                  {message.message}

                {message.isEdited && !message.isDeleted && (
                  <span className="ml-2 text-xs text-gray-200 italic">
                    edited
                  </span>
                )}
              </span>

              {/* Dropdown arrow */}
              {!loading && (
                <button
                  type="button"
                  onClick={handleMenuToggle}
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

            {/* Main options menu */}
            {showMenu && (
              <div
                className={`absolute ${
                  menuPosition === "top"
                    ? "bottom-full mb-1"
                    : "top-full mt-1"
                } z-50 w-52 rounded-md bg-[#202c33] shadow-xl border border-gray-700 py-1 ${
                  itsMe ? "right-0" : "left-0"
                }`}
              >
                {!showDeleteMenu ? (
                  <>
                    <button
                    type="button"
                    onClick={() => {
                      setReplyingMessage(message);
                      setEditingMessage(null);
                      setShowMenu(false);
                      setShowDeleteMenu(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-white hover:bg-[#2a3942]"
                  >
                    <MdReply size={21} />
                    Reply
                  </button>

                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex items-center justify-between w-full px-4 py-3 text-white hover:bg-[#2a3942]"
                    >
                      <span className="flex items-center gap-3">
                        <MdContentCopy size={21} />
                        Copy
                      </span>

                      {copied && (
                        <MdDone className="text-green-400" size={21} />
                      )}
                    </button>

                    <button
                      type="button"
                      className="flex items-center gap-3 w-full px-4 py-3 text-white hover:bg-[#2a3942]"
                    >
                      <IoArrowRedo size={21} />
                      Forward
                    </button>

                    {itsMe && !message.isDeleted && (
                      <button
                        type="button"
                        onClick={handleEdit}
                        className="flex items-center gap-3 w-full px-4 py-3 text-white hover:bg-[#2a3942]"
                      >
                        <MdEdit size={21} />
                        Edit
                      </button>
                    )}

                    <div className="border-t border-gray-700 my-1" />

                    <button
                      type="button"
                      onClick={() => setShowDeleteMenu(true)}
                      className="flex items-center gap-3 w-full px-4 py-3 text-white hover:bg-[#2a3942]"
                    >
                      <MdDeleteOutline size={21} />
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowDeleteMenu(false)}
                      className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:bg-[#2a3942]"
                    >
                      <MdArrowBack size={20} />
                      Back
                    </button>

                    <div className="border-t border-gray-700 my-1" />

                    <button
                      type="button"
                      onClick={handleDeleteForMe}
                      disabled={loading}
                      className="block w-full text-left px-4 py-3 text-white hover:bg-[#2a3942]"
                    >
                      Delete for me
                    </button>

                    {itsMe && !message.isDeleted && (
                      <button
                        type="button"
                        onClick={handleDeleteForEveryone}
                        disabled={loading}
                        className="block w-full text-left px-4 py-3 text-white hover:bg-[#2a3942]"
                      >
                        Delete for everyone
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Message time and ticks */}
          <div className="chat-footer">
            {formattedTime}

            {!message.isDeleted &&
              itsMe &&
              message.status === "sent" && (
                <MdDone className="text-gray-400 text-base" />
              )}

            {!message.isDeleted &&
              itsMe &&
              message.status === "delivered" && (
                <MdDoneAll className="text-gray-400 text-base" />
              )}

            {!message.isDeleted &&
              itsMe &&
              message.status === "read" && (
                <MdDoneAll className="text-blue-400 text-base" />
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Message;
