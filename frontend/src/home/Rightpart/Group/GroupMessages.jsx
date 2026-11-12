
import React, { useEffect, useRef } from "react";
import { MdDone, MdDoneAll } from "react-icons/md";

import useConversation from "../../../zustand/useConversation.js";
import useGetGroupMessages from "../../../context/Group/useGetGroupMessages.js";
import useGetGroupSocketMessage from "../../../context/Group/useGetGroupSocketMessage.js";
import Loading from "../../../components/Loading.jsx";

function GroupMessages() {
  const bottomRef = useRef(null);

  const { selectedGroup, groupMessages } = useConversation();

  const { loading } = useGetGroupMessages();

  // Real-time group messages aur status updates
  useGetGroupSocketMessage();

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
      (member) => member._id === senderId
    );

    return member?.fullname || "Group Member";
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
          const itsMe = senderId === currentUserId;

          const createdAt = new Date(message.createdAt);

          const formattedTime = createdAt.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div key={message._id} className="p-3">
              <div className={`chat ${itsMe ? "chat-end" : "chat-start"}`}>
                {!itsMe && (
                  <div className="text-xs text-gray-400 mb-1 ml-2">
                    {getSenderName(message.senderId)}
                  </div>
                )}

                <div
                  className={`chat-bubble text-white ${
                    itsMe ? "bg-blue-500" : ""
                  }`}
                >
                  {message.message}
                </div>

                <div className="chat-footer flex items-center gap-1">
                  {formattedTime}

                  {itsMe && message.status === "sent" && (
                    <MdDone className="text-sm" />
                  )}

                  {itsMe && message.status === "delivered" && (
                    <MdDoneAll className="text-sm" />
                  )}

                  {itsMe && message.status === "read" && (
                    <MdDoneAll className="text-blue-400 text-sm" />
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
