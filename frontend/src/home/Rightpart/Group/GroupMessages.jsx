import React, { useEffect, useRef, useState } from "react";
import {
  MdDone,
  MdDoneAll,
  MdKeyboardArrowDown,
  MdDeleteOutline,
  MdArrowBack,
} from "react-icons/md";

import useConversation from "../../../zustand/useConversation.js";
import useGetGroupMessages from "../../../context/Group/useGetGroupMessages.js";
import Loading from "../../../components/Loading.jsx";

import {
  deleteGroupMessageForMeAPI,
  deleteGroupMessageForEveryoneAPI,
} from "../../../api.js";

function GroupMessages() {
  const bottomRef = useRef(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [loadingMessageId, setLoadingMessageId] = useState(null);

  const { selectedGroup, groupMessages, setGroupMessages } =
    useConversation();

  const { loading } = useGetGroupMessages();

  const authUser = JSON.parse(localStorage.getItem("ChatApp"));
  const currentUserId = authUser?.user?._id;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [groupMessages]);

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

  const handleMenuToggle = (messageId) => {
    if (activeMenu === messageId) {
      setActiveMenu(null);
      setShowDeleteMenu(false);
    } else {
      setActiveMenu(messageId);
      setShowDeleteMenu(false);
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

          const createdAt = new Date(message.createdAt);

          const formattedTime = createdAt.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div key={message._id} className="p-4">
              <div className={`chat ${itsMe ? "chat-end" : "chat-start"}`}>
                {!itsMe && (
                  <div className="chat-header text-xs text-gray-400 mb-1">
                    {getSenderName(message.senderId)}
                  </div>
                )}

                <div className="relative group inline-block w-fit min-w-[65px] max-w-[85vw]">
                  {/* Message bubble */}
                  <div
                    className={`chat-bubble !w-fit !min-w-[65px] !max-w-[85vw] relative inline-block text-white pr-8 break-words ${
                      itsMe ? "bg-blue-500" : ""
                    } ${message.isDeleted ? "italic text-gray-300" : ""}`}
                  >
                    <span className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                      {message.message}
                    </span>

                    {/* Dropdown arrow */}
                    {!loadingMessageId && (
                      <button
                        type="button"
                        onClick={() => handleMenuToggle(message._id)}
                        title="Message options"
                        className="absolute top-1 right-1 p-0.5 rounded-full text-white bg-black/20 hover:bg-black/40 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity duration-150"
                      >
                        <MdKeyboardArrowDown size={21} />
                      </button>
                    )}
                  </div>

                  {/* Delete menu */}
                  {activeMenu === message._id && (
                    <div
                      className={`absolute top-full mt-1 z-50 w-52 rounded-md bg-[#202c33] shadow-xl border border-gray-700 py-1 ${
                        itsMe ? "right-0" : "left-0"
                      }`}
                    >
                      {!showDeleteMenu ? (
                        <button
                          type="button"
                          onClick={() => setShowDeleteMenu(true)}
                          className="flex items-center gap-3 w-full px-4 py-3 text-white hover:bg-[#2a3942]"
                        >
                          <MdDeleteOutline size={21} />
                          Delete
                        </button>
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
                            onClick={() => handleDeleteForMe(message._id)}
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
    </div>
  );
}

export default GroupMessages;
