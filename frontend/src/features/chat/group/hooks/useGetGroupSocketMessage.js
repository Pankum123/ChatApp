import { useEffect } from "react";
import useConversation from "../../../../shared/zustand/useConversation.js";

const useGetGroupSocketMessage = (socket) => {
  const { selectedGroup, setGroupMessages } = useConversation();

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

    // New group message aur group call history
    const handleNewGroupMessage = (newMessage) => {
      if (!newMessage?._id) return;

      const messageGroupId = getId(newMessage.groupId);
      const senderId = getId(newMessage.senderId);
      const selectedGroupId = getId(selectedGroup?._id);

      // Other members ke messages ki delivery confirmation
      if (senderId !== currentUserId) {
        socket.emit("groupMessageDelivered", {
          messageId: newMessage._id,
        });
      }

      // Sirf selected group ke messages UI mein dikhao
      if (messageGroupId !== selectedGroupId) return;

      setGroupMessages((prevMessages) => {
        const alreadyExists = prevMessages.some(
          (message) =>
            String(message._id) === String(newMessage._id)
        );

        if (alreadyExists) return prevMessages;

        return [...prevMessages, newMessage];
      });

      // Selected group mein message read confirmation
      if (senderId !== currentUserId) {
        socket.emit("groupMessagesRead", {
          groupId: selectedGroupId,
        });
      }
    };

    // Group message status update
    const handleGroupMessageStatus = (statusData) => {
      setGroupMessages((prevMessages) =>
        prevMessages.map((message) =>
          String(message._id) === String(statusData.messageId)
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

    // Group message deleted for everyone
    const handleGroupMessageDeleted = (deletedData) => {
      if (
        getId(deletedData.groupId) !==
        getId(selectedGroup?._id)
      ) {
        return;
      }

      setGroupMessages((prevMessages) =>
        prevMessages.map((message) =>
          String(message._id) === String(deletedData.messageId)
            ? {
                ...message,
                message: deletedData.message,
                isDeleted: deletedData.isDeleted,
                deletedAt: deletedData.deletedAt,
              }
            : message
        )
      );
    };

    // Group message edited
    const handleGroupMessageEdited = (editedData) => {
      if (
        getId(editedData.groupId) !==
        getId(selectedGroup?._id)
      ) {
        return;
      }

      setGroupMessages((prevMessages) =>
        prevMessages.map((message) =>
          String(message._id) === String(editedData.messageId)
            ? {
                ...message,
                message: editedData.message,
                isEdited: editedData.isEdited,
                editedAt: editedData.editedAt,
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
    socket.on(
      "groupMessageDeletedForEveryone",
      handleGroupMessageDeleted
    );
    socket.on("groupMessageEdited", handleGroupMessageEdited);

    return () => {
      socket.off("newGroupMessage", handleNewGroupMessage);
      socket.off(
        "groupMessageStatusUpdated",
        handleGroupMessageStatus
      );
      socket.off(
        "groupMessageDeletedForEveryone",
        handleGroupMessageDeleted
      );
      socket.off("groupMessageEdited", handleGroupMessageEdited);
    };
  }, [socket, selectedGroup?._id, setGroupMessages]);
};

export default useGetGroupSocketMessage;
