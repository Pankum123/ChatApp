import { Server } from "socket.io";
import http from "http";
import express from "express";
import oneToOneSocket from "./oneToOneSocket.js";
import groupSocket from "./groupSocket.js";

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:3001",
  "https://chatapp-pankaj-j656.onrender.com"
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// realtime message code goes here
export const getReceiverSocketId = (receiverId) => {
  return users[receiverId];
};

const users = {};

// used to listen events on server side.
io.on("connection", async (socket) => {
  console.log("a user connected", socket.id);

  const userId = socket.handshake.query.userId;

  if (userId) {
    users[userId] = socket.id;
    console.log("Hello ", users);
  }

  // used to send the events to all connected users
  io.emit("getOnlineUsers", Object.keys(users));

  // One-to-One Socket Events
  await oneToOneSocket(
    io,
    socket,
    userId,
    getReceiverSocketId
  );

  // Group Socket Events
  await groupSocket(
    io,
    socket,
    userId,
    getReceiverSocketId
  );

  // used to listen client side events emitted by server side
  socket.on("disconnect", () => {
    console.log("a user disconnected", socket.id);

    if (users[userId] === socket.id) {
      delete users[userId];
    }

    io.emit("getOnlineUsers", Object.keys(users));
  });
});

export { app, io, server };
