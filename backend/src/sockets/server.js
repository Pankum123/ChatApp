// import { Server } from "socket.io";
// import http from "http";
// import express from "express";
// import Message from "../modules/message/message.model.js";

// const app = express();

// const server = http.createServer(app);

// const allowedOrigins = [
//   "http://localhost:3001",
//   "https://chatapp-pankaj-j656.onrender.com"
// ];

// const io = new Server(server, {
//   cors: {
//     origin: allowedOrigins,
//     methods: ["GET", "POST"],
//     credentials: true,
//   },
// });

// // realtime message code goes here
// export const getReceiverSocketId = (receiverId) => {
//   return users[receiverId];
// };

// const users = {};

// // used to listen events on server side.
// io.on("connection", async(socket) => {
//   console.log("a user connected", socket.id);
//   const userId = socket.handshake.query.userId;
//   if (userId) {
//     users[userId] = socket.id;
//     console.log("Hello ", users);
//   }
//   // used to send the events to all connected users
//   io.emit("getOnlineUsers", Object.keys(users));

//     // Login hone par pending messages delivered mark karna
//   try {
//     const pendingMessages = await Message.find({
//       receiverId: userId,
//       status: "sent",
//     });

//     await Promise.all(
//       pendingMessages.map(async (message) => {
//         message.status = "delivered";
//         message.deliveredAt = new Date();
//         await message.save();

//         const senderSocketId = getReceiverSocketId(
//           message.senderId.toString()
//         );

//         if (senderSocketId) {
//           io.to(senderSocketId).emit("messageStatusUpdated", {
//             messageId: message._id.toString(),
//             status: "delivered",
//             deliveredAt: message.deliveredAt,
//           });
//         }
//       })
//     );
//   } catch (error) {
//     console.log("Pending messages delivery error:", error);
//   }

//   // Message delivered event
//   socket.on("messageDelivered", async ({ messageId } = {}) => {
//     try {
//       const message = await Message.findOneAndUpdate(
//         {
//           _id: messageId,
//           receiverId: userId,
//           status: "sent",
//         },
//         {
//           $set: {
//             status: "delivered",
//             deliveredAt: new Date(),
//           },
//         },
//         { new: true }
//       );

//       if (!message) return;

//       const senderSocketId = getReceiverSocketId(
//         message.senderId.toString()
//       );

//       if (senderSocketId) {
//         io.to(senderSocketId).emit("messageStatusUpdated", {
//           messageId: message._id.toString(),
//           status: "delivered",
//           deliveredAt: message.deliveredAt,
//         });
//       }
//     } catch (error) {
//       console.log("Message delivered error:", error);
//     }
//   });

//   // Message read event
//   socket.on("messagesRead", async ({ senderId } = {}) => {
//     try {
//       const unreadMessages = await Message.find({
//         senderId,
//         receiverId: userId,
//         status: { $ne: "read" },
//       });

//       if (unreadMessages.length === 0) return;

//       const readAt = new Date();

//       await Promise.all(
//         unreadMessages.map(async (message) => {
//           message.status = "read";
//           message.readAt = readAt;

//           if (!message.deliveredAt) {
//             message.deliveredAt = readAt;
//           }

//           await message.save();

//           const senderSocketId = getReceiverSocketId(
//             message.senderId.toString()
//           );

//           if (senderSocketId) {
//             io.to(senderSocketId).emit("messageStatusUpdated", {
//               messageId: message._id.toString(),
//               status: "read",
//               deliveredAt: message.deliveredAt,
//               readAt: message.readAt,
//             });
//           }
//         })
//       );
//     } catch (error) {
//       console.log("Messages read error:", error);
//     }
//   });

//   // used to listen client side events emitted by server side (server & client)
//   socket.on("disconnect", () => {
//     console.log("a user disconnected", socket.id);
//     // delete users[userId];
//     if (users[userId] === socket.id) {
//       delete users[userId];
//     }
//     io.emit("getOnlineUsers", Object.keys(users));
//   });
// });

// export { app, io, server };



import { Server } from "socket.io";
import http from "http";
import express from "express";
import oneToOneSocket from "./oneToOneSocket.js";

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
