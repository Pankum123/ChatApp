
import React, { useEffect, useRef } from "react";
import Message from "../Message";

// Temporary Dummy Messages
const dummyMessages = [
  {
    _id: "1",
    senderId: "user1",
    message: "Hey everyone! 👋",
    createdAt: new Date(),
    status: "read",
  },
  {
    _id: "2",
    senderId: "user2",
    message: "Hello! How are you all?",
    createdAt: new Date(),
    status: "read",
  },
  {
    _id: "3",
    senderId: "user1",
    message: "Welcome to our group!",
    createdAt: new Date(),
    status: "read",
  },
  {
    _id: "4",
    senderId: "user3",
    message: "Thank you 😊",
    createdAt: new Date(),
    status: "read",
  },
];

function GroupMessages() {
  const lastMsgRef = useRef();

  useEffect(() => {
    lastMsgRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, []);

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ minHeight: "calc(92vh - 8vh)" }}
    >
      {dummyMessages.map((message) => (
        <div key={message._id} ref={lastMsgRef}>
          <Message message={message} />
        </div>
      ))}
    </div>
  );
}

export default GroupMessages;
