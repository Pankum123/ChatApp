
import { useState } from "react";
import useConversation from "../../../../zustand/useConversation.js";
import { sendGroupMessageAPI } from "../../../../shared/api.js";

const useSendGroupMessage = () => {
  const [loading, setLoading] = useState(false);

  const {
    selectedGroup,
    groupMessages,
    setGroupMessages,
    setGroupReplyingMessage,
  } = useConversation();

  const sendGroupMessage = async (message, replyTo = null) => {
    if (!message.trim() || !selectedGroup?._id) return;

    setLoading(true);

    try {
      const res = await sendGroupMessageAPI(
        selectedGroup._id,
        message,
        replyTo
      );

      const newMessage = res.data;

      // Socket se same message dobara aaye to duplicate nahi hoga
      setGroupMessages((prevMessages) => {
        const alreadyExists = prevMessages.some(
          (item) => item._id === newMessage._id
        );

        if (alreadyExists) return prevMessages;

        return [...prevMessages, newMessage];
      });
      setGroupReplyingMessage(null);
    } catch (error) {
      console.log("Error in sending group message:", error);
    } finally {
      setLoading(false);
    }
  };

  return { loading, sendGroupMessage };
};

export default useSendGroupMessage;
