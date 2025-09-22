// import express from "express";
// import dotenv from "dotenv";
// import mongoose from "mongoose";
// import cors from "cors";
// import cookieParser from "cookie-parser";

// import userRoute from "./routes/user.route.js";
// import messageRoute from "./routes/message.route.js";
// import { app, server } from "./SocketIO/server.js";

// dotenv.config();

// // middleware
// app.use(express.json());
// app.use(cookieParser());
// app.use(cors());


// const PORT = process.env.PORT || 4001;
// const URI = process.env.MONGODB_URI;

// try {
//   mongoose.connect(URI);
//   console.log("Connected to MongoDB");
// } catch (error) {
//   console.log(error);
// }

// //routes
// app.use("/api/user", userRoute);
// app.use("/api/message", messageRoute);

// server.listen(PORT, () => {
//   console.log(`Server is Running on port ${PORT}`);
// });

import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";

import userRoute from "./routes/user.route.js";
import messageRoute from "./routes/message.route.js";
import { app, server } from "./SocketIO/server.js";

dotenv.config();

// middleware
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:3001", 
  "https://chatapp-pankaj-j656.onrender.com"
];

// ✅ Proper CORS middleware, handles preflight automatically
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // Postman, curl
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"), false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
}));

// MongoDB connection
const PORT = process.env.PORT || 4001;
const URI = process.env.MONGODB_URI;

mongoose.connect(URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("MongoDB connection error:", err));

// routes
app.use("/api/user", userRoute);
app.use("/api/message", messageRoute);

// start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
