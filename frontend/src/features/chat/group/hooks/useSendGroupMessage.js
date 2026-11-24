import { useState } from "react";
import useConversation from "../../../../shared/zustand/useConversation.js";
import { sendGroupMessageAPI } from "../../../../shared/api.js";

const useSendGroupMessage = () => {
  const [loading, setLoading] = useState(false);

  const {
    selectedGroup,
    setGroupMessages,
    setGroupReplyingMessage,
  } = useConversation();

  const sendGroupMessage = async (
    message = "",
    attachments = [],
    replyTo = null
  ) => {
    if (
      (!message.trim() && attachments.length === 0) ||
      !selectedGroup?._id
    ) {
      return false;
    }

    setLoading(true);

    try {
      const res = await sendGroupMessageAPI(
        selectedGroup._id,
        message,
        attachments,
        replyTo
      );

      const newMessage = res.data;

      // Avoid duplicate messages from socket
      setGroupMessages((prevMessages) => {
        const alreadyExists = prevMessages.some(
          (item) => item._id === newMessage._id
        );

        if (alreadyExists) return prevMessages;

        return [...prevMessages, newMessage];
      });

      setGroupReplyingMessage(null);

      return true;
    } catch (error) {
      console.log(
        "Error in sending group message:",
        error.response?.data?.error || error.message
      );

      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    sendGroupMessage,
  };
};

export default useSendGroupMessage;