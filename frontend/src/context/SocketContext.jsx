import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import io from "socket.io-client";
import useGetGroupSocketMessage from "./Group/useGetGroupSocketMessage.js";
const socketContext = createContext();

// it is a hook.
export const useSocketContext = () => {
  return useContext(socketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [groupTypingUsers, setGroupTypingUsers] = useState([]);

  const [authUser] = useAuth();
  useGetGroupSocketMessage(socket);

  // Use single environment variable for backend (API + Socket)
  const BACKEND_URL = import.meta.env.VITE_API_URL; // same as api.js

  useEffect(() => {
    if (authUser) {
      const socket = io(BACKEND_URL, {
        query: {
          userId: authUser.user._id,
        },
      });
      setSocket(socket);
      socket.on("getOnlineUsers", (users) => {
        setOnlineUsers(users);
      });
      socket.on("newMessage", (newMessage) => {
        socket.emit("messageDelivered", {
          messageId: newMessage._id,
        });
      });

      // Receive private chat typing event
      socket.on("userTyping", ({ senderId }) => {
        setTypingUsers((prev) =>
          prev.includes(senderId) ? prev : [...prev, senderId]
        );
      });

      // Receive private chat stop typing event
      socket.on("userStopTyping", ({ senderId }) => {
        setTypingUsers((prev) =>
          prev.filter((id) => id !== senderId)
        );
      });

      // Receive group chat typing event
      socket.on("groupUserTyping", ({ groupId, senderId }) => {
        setGroupTypingUsers((prev) => {
          const alreadyTyping = prev.some(
            (item) =>
              item.groupId === groupId &&
              item.senderId === senderId
          );

          if (alreadyTyping) return prev;

          return [...prev, { groupId, senderId }];
        });
      });

      // Receive group chat stop typing event
      socket.on("groupUserStopTyping", ({ groupId, senderId }) => {
        setGroupTypingUsers((prev) =>
          prev.filter(
            (item) =>
              item.groupId !== groupId ||
              item.senderId !== senderId
          )
        );
      });

      return () => socket.close();
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
      setTypingUsers([]);
      setGroupTypingUsers([]);
    }
  }, [authUser]);
  return (
    <socketContext.Provider value={{ socket, onlineUsers, typingUsers, groupTypingUsers }}>
      {children}
    </socketContext.Provider>
  );
};
