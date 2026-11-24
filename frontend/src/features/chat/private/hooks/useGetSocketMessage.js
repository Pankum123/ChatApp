import React, { useEffect } from "react";
import { useSocketContext } from "../../../../shared/realtime/SocketContext.jsx";
import useConversation from "../../../../shared/zustand/useConversation.js";
import sound from "../../../../assets/notification.mp3";

const useGetSocketMessage = () => {
  const { socket } = useSocketContext();
  const { setMessage } = useConversation();

  useEffect(() => {
    if (!socket) return;

    const authUser = JSON.parse(
      localStorage.getItem("ChatApp") || "{}"
    );

    const currentUserId = String(authUser?.user?._id || "");

    const getId = (value) => {
      if (!value) return "";
      return String(value._id || value);
    };

    // New private message aur call history receive karna
    const handleNewMessage = (newMessage) => {
      if (!newMessage?._id) return;

      const senderId = getId(newMessage.senderId);
      const receiverId = getId(newMessage.receiverId);

      const selectedConversation =
        useConversation.getState().selectedConversation;

      const selectedUserId = getId(selectedConversation?._id);

      if (!selectedUserId || !currentUserId) return;

      // Check karo message selected conversation ka hi hai
      const isCurrentConversation =
        (senderId === currentUserId &&
          receiverId === selectedUserId) ||
        (senderId === selectedUserId &&
          receiverId === currentUserId);

      if (!isCurrentConversation) return;

      const currentMessages =
        useConversation.getState().messages;

      // Duplicate message prevent karo
      const alreadyExists = currentMessages.some(
        (message) =>
          String(message._id) === String(newMessage._id)
      );

      if (alreadyExists) return;

      // Incoming message ko delivered mark karo
      if (receiverId === currentUserId) {
        socket.emit("messageDelivered", {
          messageId: newMessage._id,
        });

        socket.emit("messagesRead", {
          senderId,
        });
      }

      // Call history par notification sound nahi bajana
      if (newMessage.messageType !== "call") {
        const notification = new Audio(sound);
        notification.play().catch(() => {});
      }

      setMessage([...currentMessages, newMessage]);
    };

    // Message status update
    const handleMessageStatusUpdated = (updatedMessage) => {
      const currentMessages =
        useConversation.getState().messages;

      const updatedMessages = currentMessages.map((message) => {
        if (
          String(message._id) ===
          String(updatedMessage.messageId)
        ) {
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

    // Delete for everyone realtime update
    const handleMessageDeleted = (deletedMessage) => {
      const currentMessages =
        useConversation.getState().messages;

      const updatedMessages = currentMessages.map((message) => {
        if (
          String(message._id) ===
          String(deletedMessage.messageId)
        ) {
          return {
            ...message,
            message: deletedMessage.message,
            isDeleted: true,
            deletedAt: deletedMessage.deletedAt,
          };
        }

        return message;
      });

      setMessage(updatedMessages);
    };

    socket.on("newMessage", handleNewMessage);
    socket.on(
      "messageStatusUpdated",
      handleMessageStatusUpdated
    );
    socket.on(
      "messageDeletedForEveryone",
      handleMessageDeleted
    );

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off(
        "messageStatusUpdated",
        handleMessageStatusUpdated
      );
      socket.off(
        "messageDeletedForEveryone",
        handleMessageDeleted
      );
    };
  }, [socket, setMessage]);
};

export default useGetSocketMessage;
