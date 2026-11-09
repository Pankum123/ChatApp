import React, { useEffect, useState } from "react";
import useConversation from "../zustand/useConversation.js";
// import axios from "axios";
import { getMessagesByConversation  } from '../api.js'
import { useSocketContext } from "./SocketContext.jsx";

const useGetMessage = () => {
  const [loading, setLoading] = useState(false);
  const { messages, setMessage, selectedConversation } = useConversation();
  const { socket } = useSocketContext();

  useEffect(() => {
    const getMessages = async () => {
      setLoading(true);
      if (selectedConversation && selectedConversation._id) {
        try {
          // const res = await axios.get(
          //   `/api/message/get/${selectedConversation._id}`
          // );
          const res = await getMessagesByConversation(selectedConversation._id);
          setMessage(res.data);

           // Messages read hone ki confirmation
          if (socket) {
            socket.emit("messagesRead", {
              senderId: selectedConversation._id,
            });
          }

          setLoading(false);
        } catch (error) {
          console.log("Error in getting messages", error);
          setLoading(false);
        }
      }
    };
    getMessages();
  }, [selectedConversation, setMessage, socket]);
  return { loading, messages };
};

export default useGetMessage;
