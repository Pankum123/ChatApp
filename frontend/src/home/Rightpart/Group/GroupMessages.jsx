import React, { useEffect, useRef, useState } from "react";
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

import useConversation from "../../../zustand/useConversation.js";
import useGetGroupMessages from "../../../features/chat/group/hooks/useGetGroupMessages.js";
import Loading from "../../../components/Loading.jsx";
import ForwardModal from "../ForwardModal.jsx";

import {
  deleteGroupMessageForMeAPI,
  deleteGroupMessageForEveryoneAPI,
} from "../../../shared/api.js";

function GroupMessages() {
  const bottomRef = useRef(null);
  const menuRef = useRef(null);

  const [activeMenu, setActiveMenu] = useState(null);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [loadingMessageId, setLoadingMessageId] = useState(null);
  const [menuPosition, setMenuPosition] = useState("bottom");
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [forwardMessage, setForwardMessage] = useState(null);

  const {
    selectedGroup,
    groupMessages,
    setGroupMessages,
    setEditingMessage,
    setGroupReplyingMessage,
  } = useConversation();

  const { loading } = useGetGroupMessages();

  const authUser = JSON.parse(localStorage.getItem("ChatApp"));
  const currentUserId = authUser?.user?._id;

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [groupMessages]);

  // Close menu on outside click
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setActiveMenu(null);
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

  const getSenderId = (sender) => {
    return sender?._id || sender;
  };

  const getSenderName = (sender) => {
    if (sender?.fullname) return sender.fullname;

    const senderId = getSenderId(sender);

    const member = selectedGroup?.members?.find(
      (member) => String(member._id) === String(senderId)
    );

    return member?.fullname || "Group Member";
  };

  // Open forward modal for a group message
  const handleForward = (message) => {
    setForwardMessage(message);
    setActiveMenu(null);
    setShowDeleteMenu(false);
  };

  // Reply to group message
  const handleReply = (message) => {
    setGroupReplyingMessage(message);
    setEditingMessage(null);
    setActiveMenu(null);
    setShowDeleteMenu(false);
  };

  // Scroll to original replied message
  const handleScrollToReply = (replyTo) => {
    if (!replyTo?._id) return;

    const originalMessage = document.getElementById(
      `group-message-${replyTo._id}`
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
  };

  // Open menu in available direction
  const handleMenuToggle = (messageId, event) => {
    if (activeMenu === messageId) {
      setActiveMenu(null);
      setShowDeleteMenu(false);
      return;
    }

    const messageElement = event.currentTarget.closest(
      ".group-message-menu"
    );

    if (messageElement) {
      const rect = messageElement.getBoundingClientRect();
      const menuHeight = 300;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
        setMenuPosition("top");
      } else {
        setMenuPosition("bottom");
      }
    }

    setActiveMenu(messageId);
    setShowDeleteMenu(false);
  };

  // Edit group message
  const handleEdit = (message) => {
    setEditingMessage(message);
    setGroupReplyingMessage(null);
    setActiveMenu(null);
    setShowDeleteMenu(false);
  };

  // Copy group message
  const handleCopy = async (messageId, messageText) => {
    try {
      await navigator.clipboard.writeText(messageText);

      setCopiedMessageId(messageId);

      setTimeout(() => {
        setCopiedMessageId(null);
        setActiveMenu(null);
        setShowDeleteMenu(false);
      }, 1000);
    } catch (error) {
      console.log("Copy message error:", error);
    }
  };

  // Delete group message for me
  const handleDeleteForMe = async (messageId) => {
    try {
      setLoadingMessageId(messageId);

      await deleteGroupMessageForMeAPI(
        selectedGroup._id,
        messageId
      );

      setGroupMessages((prevMessages) =>
        prevMessages.filter((item) => item._id !== messageId)
      );

      setActiveMenu(null);
      setShowDeleteMenu(false);
    } catch (error) {
      console.log("Delete group message for me error:", error);
    } finally {
      setLoadingMessageId(null);
    }
  };

  // Delete group message for everyone
  const handleDeleteForEveryone = async (messageId) => {
    try {
      setLoadingMessageId(messageId);

      await deleteGroupMessageForEveryoneAPI(
        selectedGroup._id,
        messageId
      );

      setGroupMessages((prevMessages) =>
        prevMessages.map((item) =>
          item._id === messageId
            ? {
                ...item,
                message: "This message was deleted",
                isDeleted: true,
                deletedAt: new Date(),
              }
            : item
        )
      );

      setActiveMenu(null);
      setShowDeleteMenu(false);
    } catch (error) {
      console.log("Delete group message for everyone error:", error);
    } finally {
      setLoadingMessageId(null);
    }
  };

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ minHeight: "calc(92vh - 8vh)" }}
    >
      {loading ? (
        <Loading />
      ) : groupMessages.length > 0 ? (
        groupMessages.map((message) => {
          const senderId = getSenderId(message.senderId);
          const itsMe = String(senderId) === String(currentUserId);

          const chatName = itsMe ? "chat-end" : "chat-start";
          const chatColor = itsMe ? "bg-blue-500" : "";

          const createdAt = new Date(message.createdAt);

          const formattedTime = createdAt.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div key={message._id}>
              <div className="p-4">
                <div className={`chat ${chatName}`}>
                  {!itsMe && (
                    <div className="chat-header text-xs text-gray-400 mb-1">
                      {getSenderName(message.senderId)}
                    </div>
                  )}

                  <div
                    className="relative group inline-block w-fit min-w-[65px] max-w-[85vw] group-message-menu"
                    ref={activeMenu === message._id ? menuRef : null}
                  >
                    {/* Message bubble */}
                    <div
                      id={`group-message-${message._id}`}
                      className={`chat-bubble !w-fit !min-w-[65px] !max-w-[85vw] relative inline-block text-white pr-8 break-words ${chatColor} ${
                        message.isDeleted
                          ? "italic text-gray-300"
                          : ""
                      }`}
                    >
                      {/* Replied Message Preview */}
                      {message.replyTo && (
                        <div
                          onClick={() =>
                            handleScrollToReply(message.replyTo)
                          }
                          className="bg-black/20 border-l-4 border-green-400 rounded-md px-3 py-2 mb-2 cursor-pointer hover:bg-black/30"
                        >
                          <p className="text-green-300 text-xs font-semibold mb-1">
                            {getSenderName(message.replyTo.senderId)}
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

                      <span className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                        {message.message}

                        {message.isEdited && !message.isDeleted && (
                          <span className="ml-2 text-xs text-gray-200 italic">
                            edited
                          </span>
                        )}
                      </span>

                      {/* Dropdown arrow */}
                      {!loadingMessageId && (
                        <button
                          type="button"
                          onClick={(e) =>
                            handleMenuToggle(message._id, e)
                          }
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
                    {activeMenu === message._id && (
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
                              onClick={() => handleReply(message)}
                              className="flex items-center gap-3 w-full px-4 py-3 text-white hover:bg-[#2a3942]"
                            >
                              <MdReply size={21} />
                              Reply
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(message._id, message.message)
                              }
                              className="flex items-center justify-between w-full px-4 py-3 text-white hover:bg-[#2a3942]"
                            >
                              <span className="flex items-center gap-3">
                                <MdContentCopy size={21} />
                                Copy
                              </span>

                              {copiedMessageId === message._id && (
                                <MdDone
                                  className="text-green-400"
                                  size={21}
                                />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleForward(message)}
                              disabled={message.isDeleted}
                              className="flex items-center gap-3 w-full px-4 py-3 text-white hover:bg-[#2a3942] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <IoArrowRedo size={21} />
                              Forward
                            </button>

                            {itsMe && !message.isDeleted && (
                              <button
                                type="button"
                                onClick={() => handleEdit(message)}
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
                              onClick={() =>
                                handleDeleteForMe(message._id)
                              }
                              disabled={loadingMessageId === message._id}
                              className="block w-full text-left px-4 py-3 text-white hover:bg-[#2a3942]"
                            >
                              Delete for me
                            </button>

                            {itsMe && !message.isDeleted && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteForEveryone(message._id)
                                }
                                disabled={loadingMessageId === message._id}
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
        })
      ) : (
        <div>
          <p className="text-center mt-[20%]">
            Say Hi to start the group conversation
          </p>
        </div>
      )}

      <div ref={bottomRef} />

      {/* Forward Modal */}
      {forwardMessage && (
        <ForwardModal
          message={forwardMessage}
          sourceType="group"
          onClose={() => setForwardMessage(null)}
        />
      )}
    </div>
  );
}

export default GroupMessages;
