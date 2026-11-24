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

import useConversation from "../../../../../shared/zustand/useConversation.js";
import ForwardModal from "./ForwardModal.jsx";
import CallHistory from "../../../components/CallHistory.jsx";

import {
  deleteMessageForMeAPI,
  deleteMessageForEveryoneAPI,
} from "../../../../../shared/api.js";

// Attachment Preview Component
function AttachmentPreview({ attachment }) {
  const { url, fileName, fileType, fileSize } = attachment;

  const formattedSize = Number.isFinite(fileSize)
    ? `${(fileSize / (1024 * 1024)).toFixed(2)} MB`
    : "";

  // Image
  if (fileType?.startsWith("image/")) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="block mt-2"
      >
        <img
          src={url}
          alt={fileName || "Shared image"}
          loading="lazy"
          className="max-h-72 max-w-full rounded-lg object-contain"
        />
      </a>
    );
  }

  // Video
  if (fileType?.startsWith("video/")) {
    return (
      <video
        controls
        preload="metadata"
        className="mt-2 max-h-72 max-w-full rounded-lg"
      >
        <source src={url} type={fileType} />
        Your browser does not support video playback.
      </video>
    );
  }

  // Audio
  if (fileType?.startsWith("audio/")) {
    return (
      <div className="mt-2 min-w-[220px] max-w-full">
        <audio
          controls
          preload="metadata"
          className="max-w-full"
        >
          <source src={url} type={fileType} />
          Your browser does not support audio playback.
        </audio>
      </div>
    );
  }

  // PDF and other documents
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="mt-2 flex items-center gap-3 rounded-lg bg-black/20 hover:bg-black/30 p-3 text-white"
    >
      <MdContentCopy size={22} />

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium break-all">
          {fileName || "Download attachment"}
        </span>

        <span className="block text-xs text-gray-300">
          {formattedSize}
        </span>
      </span>

      <span className="text-xs underline">
        Open
      </span>
    </a>
  );
}

function Message({ message }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
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

  // Render private call history
  if (message.messageType === "call" && message.call) {
    return (
      <CallHistory
        call={message.call}
        currentUserId={userId}
      />
    );
  }

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

  // Forward private message
  const handleForward = () => {
    setShowMenu(false);
    setShowDeleteMenu(false);
    setShowForwardModal(true);
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

                      originalMessage.classList.add(
                        "ring-2",
                        "ring-green-400"
                      );

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

              {/* Forwarded label */}
              {message.isForwarded && !message.isDeleted && (
                <div className="flex items-center gap-1 text-xs text-gray-200 italic mb-1">
                  <IoArrowRedo size={14} />
                  Forwarded
                </div>
              )}

              {/* Message content */}
              {message.isDeleted ? (
                <span className="italic text-gray-300">
                  This message was deleted
                </span>
              ) : (
                <>
                  {message.message && (
                    <span className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                      {message.message}

                      {message.isEdited && (
                        <span className="ml-2 text-xs text-gray-200 italic">
                          edited
                        </span>
                      )}
                    </span>
                  )}

                  {/* Attachments */}
                  {message.attachments?.length > 0 && (
                    <div className="mt-1 space-y-2">
                      {message.attachments.map((attachment, index) => (
                        <AttachmentPreview
                          key={`${attachment.publicId || attachment.url}-${index}`}
                          attachment={attachment}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

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
                      disabled={!message.message}
                      className="flex items-center justify-between w-full px-4 py-3 text-white hover:bg-[#2a3942] disabled:opacity-40 disabled:cursor-not-allowed"
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
                      onClick={handleForward}
                      disabled={message.isDeleted}
                      className="flex items-center gap-3 w-full px-4 py-3 text-white hover:bg-[#2a3942] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <IoArrowRedo size={21} />
                      Forward
                    </button>

                    {itsMe &&
                      !message.isDeleted &&
                      message.message &&
                      !message.attachments?.length && (
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

      {/* Forward Modal */}
      {showForwardModal && (
        <ForwardModal
          message={message}
          sourceType="private"
          onClose={() => setShowForwardModal(false)}
        />
      )}
    </div>
  );
}

export default Message;
