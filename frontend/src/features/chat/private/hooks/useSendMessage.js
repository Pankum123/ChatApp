import { useState } from "react";
import useConversation from "../../../../shared/zustand/useConversation.js";
import { sendMessageToConversation } from "../../../../shared/api.js";

const useSendMessage = () => {
  const [loading, setLoading] = useState(false);

  const {
    messages,
    setMessage,
    selectedConversation,
    setReplyingMessage,
  } = useConversation();

  const sendMessages = async (
    message = "",
    attachments = [],
    replyTo = null
  ) => {
    if (!selectedConversation?._id) return false;

    setLoading(true);

    try {
      const response = await sendMessageToConversation(
        selectedConversation._id,
        message,
        attachments,
        replyTo
      );

      setMessage([...messages, response.data]);
      setReplyingMessage(null);

      return true;
    } catch (error) {
      console.error(
        "Error sending private message:",
        error.response?.data?.error || error.message
      );

      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    sendMessages,
  };
};

export default useSendMessage;
