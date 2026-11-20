import React, { useState, useRef, useEffect } from "react";
import { IoSend } from "react-icons/io5";
import { MdClose, MdReply } from "react-icons/md";

import useSendGroupMessage from "../../../context/Group/useSendGroupMessage.js";
import { useSocketContext } from "../../../context/SocketContext.jsx";
import useConversation from "../../../zustand/useConversation.js";
import { editGroupMessageAPI } from "../../../shared/api.js";

function GroupTypesend() {
  const [message, setMessage] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const { loading, sendGroupMessage } = useSendGroupMessage();

  const { socket } = useSocketContext();

  const {
    selectedGroup,
    editingMessage,
    setEditingMessage,
    setGroupMessages,
    groupReplyingMessage,
    setGroupReplyingMessage,
  } = useConversation();

  const typingTimeout = useRef(null);
  const isTyping = useRef(false);
  const inputRef = useRef(null);

  const groupId = selectedGroup?._id;

  // Load message into input when editing
  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.message);
      setGroupReplyingMessage(null);
      inputRef.current?.focus();
    }
  }, [editingMessage]);

  // Auto scroll and focus when replying
  useEffect(() => {
    if (groupReplyingMessage) {
      inputRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });

      inputRef.current?.focus();
    }
  }, [groupReplyingMessage]);

  // Stop group typing event
  const stopTyping = () => {
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
      typingTimeout.current = null;
    }

    if (isTyping.current && socket && groupId) {
      socket.emit("groupStopTyping", { groupId });
      isTyping.current = false;
    }
  };

  // Handle input change
  const handleChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    if (editingMessage) return;

    if (!value.trim()) {
      stopTyping();
      return;
    }

    if (socket && groupId) {
      if (!isTyping.current) {
        socket.emit("groupTyping", { groupId });
        isTyping.current = true;
      }

      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }

      typingTimeout.current = setTimeout(() => {
        stopTyping();
      }, 1500);
    }
  };

  // Send or update group message
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim() || loading || editLoading) return;

    // Update existing group message
    if (editingMessage) {
      try {
        setEditLoading(true);

        const response = await editGroupMessageAPI(
          groupId,
          editingMessage._id,
          message
        );

        const editedMessage = response.data.editedMessage;

        setGroupMessages((prevMessages) =>
          prevMessages.map((item) =>
            String(item._id) === String(editingMessage._id)
              ? { ...item, ...editedMessage }
              : item
          )
        );

        setMessage("");
        setEditingMessage(null);
      } catch (error) {
        console.log("Edit group message error:", error);
      } finally {
        setEditLoading(false);
      }

      return;
    }

    // Send new group message with reply
    stopTyping();

    await sendGroupMessage(
      message.trim(),
      groupReplyingMessage?._id || null
    );

    setMessage("");
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setMessage("");
    setEditingMessage(null);
  };

  // Cancel reply
  const handleCancelReply = () => {
    setGroupReplyingMessage(null);
  };

  // Cleanup on unmount or group change
  useEffect(() => {
    return () => {
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }

      if (isTyping.current && socket && groupId) {
        socket.emit("groupStopTyping", { groupId });
        isTyping.current = false;
      }
    };
  }, [socket, groupId]);

  return (
    <form onSubmit={handleSubmit}>
      {/* Group Reply Preview */}
      {groupReplyingMessage && !editingMessage && (
        <div className="flex items-center justify-between bg-[#202c33] border-l-4 border-green-500 px-4 py-2 mx-2 rounded-t-lg">
          <div className="flex items-center gap-2 overflow-hidden">
            <MdReply className="text-green-400 text-xl shrink-0" />

            <div className="overflow-hidden">
              <p className="text-green-400 text-sm font-semibold">
                Replying to {groupReplyingMessage.senderId?.fullname || "message"}
              </p>

              <p className="text-gray-300 text-sm truncate">
                {groupReplyingMessage.isDeleted
                  ? "This message was deleted"
                  : groupReplyingMessage.message}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCancelReply}
            className="text-gray-400 hover:text-white p-1"
          >
            <MdClose size={22} />
          </button>
        </div>
      )}

      <div className="flex space-x-1 h-[8vh] bg-gray-800">
        <div className="w-[70%] mx-4">
          <input
            ref={inputRef}
            type="text"
            placeholder={editingMessage ? "Edit message..." : "Type here..."}
            value={message}
            onChange={handleChange}
            className="border border-gray-700 rounded-xl outline-none mt-1 px-4 py-3 w-full"
          />
        </div>

        {editingMessage && (
          <button
            type="button"
            onClick={handleCancelEdit}
            className="text-gray-300 px-2"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={loading || editLoading || !message.trim()}
          className="flex items-center"
        >
          {editingMessage ? (
            <span className="text-green-400 font-semibold px-2">
              Update
            </span>
          ) : (
            <IoSend className="text-3xl" />
          )}
        </button>
      </div>
    </form>
  );
}

export default GroupTypesend;
