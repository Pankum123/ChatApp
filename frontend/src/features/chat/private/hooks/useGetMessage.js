import { useEffect, useState } from "react";
import useConversation from "../../../../shared/zustand/useConversation.js";
import { getMessagesByConversation } from "../../../../shared/api.js";
import { useSocketContext } from "../../../../shared/realtime/SocketContext.jsx";

const useGetMessage = () => {
  const [loading, setLoading] = useState(false);

  const {
    messages,
    setMessage,
    selectedConversation,
  } = useConversation();

  const { socket } = useSocketContext();

  const conversationId = selectedConversation?._id;

  useEffect(() => {
    let isCancelled = false;

    const getMessages = async () => {
      if (!conversationId) {
        setMessage([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setMessage([]);

      try {
        const res = await getMessagesByConversation(conversationId);

        if (isCancelled) return;

        // Normal messages aur call history dono load honge
        setMessage(Array.isArray(res.data) ? res.data : []);

        // Unread messages ko read mark karna
        if (socket) {
          socket.emit("messagesRead", {
            senderId: conversationId,
          });
        }
      } catch (error) {
        if (!isCancelled) {
          console.log(
            "Error in getting messages:",
            error.response?.data || error.message
          );
          setMessage([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    getMessages();

    return () => {
      isCancelled = true;
    };
  }, [conversationId, setMessage, socket]);

  return { loading, messages };
};

export default useGetMessage;
