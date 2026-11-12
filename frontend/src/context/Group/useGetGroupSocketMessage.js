
import { useEffect } from "react";
import useConversation from "../../zustand/useConversation.js";
import { useSocketContext } from "../SocketContext.jsx";

const useGetGroupSocketMessage = () => {
  const {
    selectedGroup,
    groupMessages,
    setGroupMessages,
  } = useConversation();

  const { socket } = useSocketContext();

  useEffect(() => {
    if (!socket) return;

    const authUser = JSON.parse(localStorage.getItem("ChatApp"));
    const currentUserId = authUser?.user?._id;

    // New group message receive karna
    const handleNewGroupMessage = (newMessage) => {
      const messageGroupId =
        newMessage.groupId?._id || newMessage.groupId;

      const senderId =
        newMessage.senderId?._id || newMessage.senderId;

      // Sirf currently selected group ka message append hoga
      if (messageGroupId !== selectedGroup?._id) return;

      setGroupMessages((prevMessages) => {
        const alreadyExists = prevMessages.some(
          (message) => message._id === newMessage._id
        );

        if (alreadyExists) return prevMessages;

        return [...prevMessages, newMessage];
      });

      // Apna message nahi hai to delivered confirmation bhejo
      if (senderId !== currentUserId) {
        socket.emit("groupMessageDelivered", {
          messageId: newMessage._id,
        });

        // Selected group mein message read hone ki confirmation
        socket.emit("groupMessagesRead", {
          groupId: selectedGroup._id,
        });
      }
    };

    // Group message status update receive karna
    const handleGroupMessageStatus = (statusData) => {
      setGroupMessages((prevMessages) =>
        prevMessages.map((message) =>
          message._id === statusData.messageId
            ? {
                ...message,
                status: statusData.status,
                deliveredTo: statusData.deliveredTo,
                readBy: statusData.readBy,
                deliveredAt: statusData.deliveredAt,
                readAt: statusData.readAt,
              }
            : message
        )
      );
    };

    socket.on("newGroupMessage", handleNewGroupMessage);

    socket.on(
      "groupMessageStatusUpdated",
      handleGroupMessageStatus
    );

    return () => {
      socket.off("newGroupMessage", handleNewGroupMessage);

      socket.off(
        "groupMessageStatusUpdated",
        handleGroupMessageStatus
      );
    };
  }, [
    socket,
    selectedGroup?._id,
    setGroupMessages,
  ]);
};

export default useGetGroupSocketMessage;
