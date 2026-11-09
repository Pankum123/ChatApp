import React, { useEffect } from "react";
import { useSocketContext } from "./SocketContext";
import useConversation from "../zustand/useConversation.js";
import sound from "../assets/notification.mp3";
const useGetSocketMessage = () => {
  const { socket } = useSocketContext();
  const { setMessage } = useConversation();

  useEffect(() => {
    if (!socket) return;

    // Incoming message receive hone par
    const handleNewMessage = (newMessage) => {
      const currentMessages = useConversation.getState().messages;

      const selectedConversation =
        useConversation.getState().selectedConversation;

      // Message delivered hone ki confirmation
      // Ye har incoming message ke liye chalega
      socket.emit("messageDelivered", {
        messageId: newMessage._id,
      });

      // Sirf selected conversation ke messages add honge
      if (
        selectedConversation &&
        newMessage.senderId === selectedConversation._id
      ) {
        // Naya message read hone ki confirmation
        socket.emit("messagesRead", {
          senderId: newMessage.senderId,
        });
        const notification = new Audio(sound);
        notification.play();

        setMessage([...currentMessages, newMessage]);

      }
    };

    // Message status update hone par
    const handleMessageStatusUpdated = (updatedMessage) => {
      const currentMessages = useConversation.getState().messages;

      const updatedMessages = currentMessages.map((message) => {
        if (message._id === updatedMessage.messageId) {
          return {
            ...message,
            status: updatedMessage.status,
            deliveredAt: updatedMessage.deliveredAt,
            readAt: updatedMessage.readAt,
          };
        }

        return message;
      });

      setMessage(updatedMessages);
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messageStatusUpdated", handleMessageStatusUpdated);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageStatusUpdated", handleMessageStatusUpdated);
    };

  }, [socket, setMessage]);
};
export default useGetSocketMessage;
