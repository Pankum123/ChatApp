import React, { useState, useRef, useEffect } from "react";
import { IoSend } from "react-icons/io5";
import { MdClose, MdReply } from "react-icons/md";
import useSendMessage from "../../features/chat/private/hooks/useSendMessage.js";
import { useSocketContext } from "../../shared/realtime/SocketContext.jsx";
import useConversation from "../../shared/zustand/useConversation.js";
import { editMessageAPI } from "../../shared/api.js";

function Typesend() {
  const [message, setMessage] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const { loading, sendMessages } = useSendMessage();
  const { socket } = useSocketContext();

  const {
    selectedConversation,
    messages,
    setMessage: setMessages,
    editingMessage,
    setEditingMessage,
    replyingMessage,
    setReplyingMessage,
  } = useConversation();

  const typingTimeout = useRef(null);
  const isTyping = useRef(false);
  const inputRef = useRef(null);

  const receiverId = selectedConversation?._id;

  // Load message into input when editing
  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.message);
      setReplyingMessage(null);
      inputRef.current?.focus();
    }
  }, [editingMessage]);

  // Auto scroll and focus when replying
  useEffect(() => {
    if (replyingMessage) {
      inputRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });

      inputRef.current?.focus();
    }
  }, [replyingMessage]);

  // Stop typing event
  const stopTyping = () => {
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
      typingTimeout.current = null;
    }

    if (isTyping.current && socket && receiverId) {
      socket.emit("stopTyping", { receiverId });
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

    if (socket && receiverId) {
      if (!isTyping.current) {
        socket.emit("typing", { receiverId });
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

  // Send or update message
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    // Update existing message
    if (editingMessage) {
      try {
        setEditLoading(true);

        const response = await editMessageAPI(
          editingMessage._id,
          message
        );

        const editedMessage = response.data.editedMessage;

        setMessages(
          messages.map((item) =>
            item._id === editingMessage._id
              ? { ...item, ...editedMessage }
              : item
          )
        );

        setMessage("");
        setEditingMessage(null);
      } catch (error) {
        console.log("Edit message error:", error);
      } finally {
        setEditLoading(false);
      }

      return;
    }

    // Send new message with reply
    stopTyping();

    await sendMessages(message, replyingMessage?._id || null);

    setMessage("");
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setMessage("");
    setEditingMessage(null);
  };

  // Cancel reply
  const handleCancelReply = () => {
    setReplyingMessage(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }

      if (isTyping.current && socket && receiverId) {
        socket.emit("stopTyping", { receiverId });
      }
    };
  }, [socket, receiverId]);

  return (
    <form onSubmit={handleSubmit}>
      {/* Reply Preview */}
      {replyingMessage && !editingMessage && (
        <div className="flex items-center justify-between bg-[#202c33] border-l-4 border-green-500 px-4 py-2 mx-2 rounded-t-lg">
          <div className="flex items-center gap-2 overflow-hidden">
            <MdReply className="text-green-400 text-xl shrink-0" />

            <div className="overflow-hidden">
              <p className="text-green-400 text-sm font-semibold">
                Replying to message
              </p>

              <p className="text-gray-300 text-sm truncate">
                {replyingMessage.isDeleted
                  ? "This message was deleted"
                  : replyingMessage.message}
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
            placeholder={editingMessage ? "Edit message..." : "Type here"}
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

export default Typesend;
