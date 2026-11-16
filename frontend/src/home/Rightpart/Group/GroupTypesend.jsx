
// import React, { useState } from "react";
// import { IoSend } from "react-icons/io5";

// import useSendGroupMessage from "../../../context/Group/useSendGroupMessage.js";

// function GroupTypesend() {
//   const [message, setMessage] = useState("");

//   const { loading, sendGroupMessage } = useSendGroupMessage();

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!message.trim() || loading) return;

//     await sendGroupMessage(message.trim());

//     setMessage("");
//   };

//   return (
//     <form onSubmit={handleSubmit}>
//       <div className="flex space-x-1 h-[8vh] bg-gray-800">
//         <div className="w-[70%] mx-4">
//           <input
//             type="text"
//             placeholder="Type here..."
//             value={message}
//             onChange={(e) => setMessage(e.target.value)}
//             className="border border-gray-700 rounded-xl outline-none mt-1 px-4 py-3 w-full"
//           />
//         </div>

//         <button type="submit" disabled={loading || !message.trim()}>
//           <IoSend className="text-3xl" />
//         </button>
//       </div>
//     </form>
//   );
// }

// export default GroupTypesend;


import React, { useState, useRef, useEffect } from "react";
import { IoSend } from "react-icons/io5";

import useSendGroupMessage from "../../../context/Group/useSendGroupMessage.js";
import { useSocketContext } from "../../../context/SocketContext.jsx";
import useConversation from "../../../zustand/useConversation.js";

function GroupTypesend() {
  const [message, setMessage] = useState("");

  const { loading, sendGroupMessage } = useSendGroupMessage();

  const { socket } = useSocketContext();
  const { selectedGroup } = useConversation();

  const typingTimeout = useRef(null);
  const isTyping = useRef(false);

  const groupId = selectedGroup?._id;

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

  // Send group message
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim() || loading) return;

    stopTyping();

    await sendGroupMessage(message.trim());

    setMessage("");
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
            type="text"
            placeholder="Type here..."
            value={message}
            onChange={handleChange}
            className="border border-gray-700 rounded-xl outline-none mt-1 px-4 py-3 w-full"
          />
        </div>

        <button type="submit" disabled={loading || !message.trim()}>
          <IoSend className="text-3xl" />
        </button>
      </div>
    </form>
  );
}

export default GroupTypesend;
