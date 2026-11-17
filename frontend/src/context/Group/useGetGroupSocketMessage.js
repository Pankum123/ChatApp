import { useEffect } from "react";
import useConversation from "../../zustand/useConversation.js";

const useGetGroupSocketMessage = (socket) => {
  const { selectedGroup, setGroupMessages } = useConversation();

  useEffect(() => {
    if (!socket) return;

    const authUser = JSON.parse(localStorage.getItem("ChatApp"));
    const currentUserId = authUser?.user?._id;

    const handleNewGroupMessage = (newMessage) => {
      const messageGroupId =
        newMessage.groupId?._id || newMessage.groupId;

      const senderId =
        newMessage.senderId?._id || newMessage.senderId;

      // Receiver hone par delivery confirmation bhejo,
      // chahe koi group selected ho ya nahi.
      if (String(senderId) !== String(currentUserId)) {
        socket.emit("groupMessageDelivered", {
          messageId: newMessage._id,
        });
      }

      // Sirf selected group ke messages UI mein dikhao.
      if (String(messageGroupId) !== String(selectedGroup?._id)) {
        return;
      }

      setGroupMessages((prevMessages) => {
        const alreadyExists = prevMessages.some(
          (message) => message._id === newMessage._id
        );

        if (alreadyExists) return prevMessages;

        return [...prevMessages, newMessage];
      });

      // Selected group mein message read confirmation.
      if (String(senderId) !== String(currentUserId)) {
        socket.emit("groupMessagesRead", {
          groupId: selectedGroup._id,
        });
      }
    };

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

    // Receive deleted group message
    const handleGroupMessageDeleted = (deletedData) => {
      if (
        String(deletedData.groupId) !==
        String(selectedGroup?._id)
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


    // Receive edited group message
    const handleGroupMessageEdited = (editedData) => {
      if (
        String(editedData.groupId) !==
        String(selectedGroup?._id)
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
    socket.on("groupMessageStatusUpdated", handleGroupMessageStatus);
    socket.on("groupMessageDeletedForEveryone",handleGroupMessageDeleted);
    socket.on("groupMessageEdited", handleGroupMessageEdited);

    return () => {
      socket.off("newGroupMessage", handleNewGroupMessage);
      socket.off("groupMessageStatusUpdated", handleGroupMessageStatus);
      socket.off("groupMessageDeletedForEveryone",handleGroupMessageDeleted);
      socket.off("groupMessageEdited", handleGroupMessageEdited);
    };
  }, [socket, selectedGroup?._id, setGroupMessages]);
};

export default useGetGroupSocketMessage;
