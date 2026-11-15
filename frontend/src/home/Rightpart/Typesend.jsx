import React, { useState, useRef, useEffect } from "react";
import { IoSend } from "react-icons/io5";
import useSendMessage from "../../context/useSendMessage.js";
import { useSocketContext } from "../../context/SocketContext.jsx";
import useConversation from "../../zustand/useConversation.js";

function Typesend() {
  const [message, setMessage] = useState("");
  const { loading, sendMessages } = useSendMessage();

  const { socket } = useSocketContext();
  const { selectedConversation } = useConversation();

  const typingTimeout = useRef(null);
  const isTyping = useRef(false);

  const receiverId = selectedConversation?._id;

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

  // Send message
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    stopTyping();

    await sendMessages(message);
    setMessage("");
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
      <div className="flex space-x-1 h-[8vh] bg-gray-800">
        <div className="w-[70%] mx-4">
          <input
            type="text"
            placeholder="Type here"
            value={message}
            onChange={handleChange}
            className="border border-gray-700 rounded-xl outline-none mt-1 px-4 py-3 w-full"
          />
        </div>

        <button type="submit" disabled={loading}>
          <IoSend className="text-3xl" />
        </button>
      </div>
    </form>
  );
}

export default Typesend;
