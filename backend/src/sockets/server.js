import { Server } from "socket.io";
import http from "http";
import express from "express";
import oneToOneSocket from "./oneToOneSocket.js";
import groupSocket from "./groupSocket.js";
import callSocket from "./callSocket.js";
import groupCallSocket from "./groupCallSocket.js";
import "dotenv/config";
import jwt from "jsonwebtoken";
import User from "../modules/user/user.model.js";

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.DEVELOPMENT_FRONTEND_URL,
  process.env.PRODUCTION_FRONTEND_URL,
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});


// GET JWT TOKEN FROM COOKIE
const getTokenFromCookie = (cookieHeader) => {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const separatorIndex = cookie.indexOf("=");

    if (separatorIndex === -1) continue;

    const name = cookie.slice(0, separatorIndex).trim();

    if (name === "jwt") {
      const value = cookie.slice(separatorIndex + 1).trim();

      try {
        return decodeURIComponent(value);
      } catch {
        return null;
      }
    }
  }

  return null;
};


// SOCKET.IO AUTHENTICATION MIDDLEWARE

io.use(async (socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie;

    const token = getTokenFromCookie(cookieHeader);

    if (!token) {
      return next(new Error("Authentication required"));
    }

    if (!process.env.JWT_TOKEN) {
      throw new Error("JWT configuration missing");
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_TOKEN
    );

    if (!decoded?.userId) {
      return next(new Error("Invalid authentication token"));
    }

    // Verify user from MongoDB
    const user = await User.findById(decoded.userId).select("_id");

    if (!user) {
      return next(new Error("User not found"));
    }

    // Attach verified identity to socket
    socket.data.userId = user._id.toString();

    next();

  } catch (error) {
    console.error(
      "Socket authentication failed:",
      error.message
    );

    next(new Error("Unauthorized connection"));
  }
});

// realtime message code goes here
export const getReceiverSocketId = (receiverId) => {
  return users[receiverId];
};

const users = {};

// used to listen events on server side.
io.on("connection", async (socket) => {
  console.log("Authenticated user connected:", socket.id);

  const userId = socket.data.userId;

  // if (userId) {
  //   users[userId] = socket.id;
  //   console.log("Hello ", users);
  // }

  if (userId) {
    users[userId] = socket.id;

    // User ko personal room mein join karwana
    socket.join(userId.toString());

    console.log("User joined personal room:", userId);
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

  // Calling Socket Events
  callSocket(
    io,
    socket,
    userId
  );

  // New group audio/video calling signaling.
  groupCallSocket(io, socket, userId);

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
