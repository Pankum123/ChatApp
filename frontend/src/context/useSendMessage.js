import React, { useState } from "react";
import useConversation from "../zustand/useConversation.js";
import { sendMessageToConversation } from '../shared/api.js'
const useSendMessage = () => {
  const [loading, setLoading] = useState(false);
  const { messages, setMessage, selectedConversation, setReplyingMessage } = useConversation();
  const sendMessages = async (message, replyTo = null) => {
    setLoading(true);
    try {
      const res = await sendMessageToConversation(selectedConversation._id, message, replyTo);
      setMessage([...messages, res.data]);
      setReplyingMessage(null);
      setLoading(false);
    } catch (error) {
      console.log("Error in send messages", error);
      setLoading(false);
    }
  };
  return { loading, sendMessages };
};

export default useSendMessage;
