import React, { useState, useRef, useEffect } from "react";
import { IoSend } from "react-icons/io5";

import useSendGroupMessage from "../../../context/Group/useSendGroupMessage.js";
import { useSocketContext } from "../../../context/SocketContext.jsx";
import useConversation from "../../../zustand/useConversation.js";
import { editGroupMessageAPI } from "../../../api.js";

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
  } = useConversation();

  const typingTimeout = useRef(null);
  const isTyping = useRef(false);
  const inputRef = useRef(null);

  const groupId = selectedGroup?._id;

  // Load message into input when editing
  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.message);
      inputRef.current?.focus();
    }
  }, [editingMessage]);

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

    // Send new group message
    stopTyping();

    await sendGroupMessage(message.trim());

    setMessage("");
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setMessage("");
    setEditingMessage(null);
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
