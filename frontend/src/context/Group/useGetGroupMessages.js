
import { useEffect, useState } from "react";
import useConversation from "../../zustand/useConversation.js";
import { getGroupMessagesAPI } from "../../api.js";
import { useSocketContext } from "../SocketContext.jsx";

const useGetGroupMessages = () => {
  const [loading, setLoading] = useState(false);

  const {
    selectedGroup,
    groupMessages,
    setGroupMessages,
  } = useConversation();

  const { socket } = useSocketContext();

  useEffect(() => {
    let isCancelled = false;

    const getGroupMessages = async () => {
      const groupId = selectedGroup?._id;

      if (!groupId) {
        setGroupMessages([]);
        return;
      }

      setLoading(true);
      setGroupMessages([]);

      try {
        // Pehle group socket room join karna
        if (socket) {
          socket.emit("joinGroup", { groupId }, (response) => {
            if (!response?.success) {
              console.log(
                "Group room join error:",
                response?.message
              );
            }
          });
        }

        // Group messages fetch karna
        const res = await getGroupMessagesAPI(groupId);

        if (isCancelled) return;

        setGroupMessages(res.data);

        // Unread messages ko read mark karna
        if (socket) {
          socket.emit("groupMessagesRead", { groupId });
        }
      } catch (error) {
        if (!isCancelled) {
          console.log(
            "Error in getting group messages:",
            error.response?.data || error.message
          );
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    getGroupMessages();

    return () => {
      isCancelled = true;
    };
  }, [selectedGroup?._id, setGroupMessages, socket]);

  return { loading, groupMessages };
};

export default useGetGroupMessages;
