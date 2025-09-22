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
import { app, server } from "./SocketIO/server.js"; // or define app here if needed

dotenv.config();

const app = express(); // in case not imported from SocketIO/server.js

// ----------------------
// 1️⃣ CORS Middleware (before routes)
// ----------------------
const allowedOrigins = [
  "http://localhost:5173",
  "https://chatapp-pankaj-j656.onrender.com"
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // allow Postman / curl
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"), false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"]
}));

// ----------------------
// 2️⃣ Middleware
// ----------------------
app.use(express.json());
app.use(cookieParser());

// ----------------------
// 3️⃣ MongoDB connection
// ----------------------
const PORT = process.env.PORT || 4001;
const URI = process.env.MONGODB_URI;

mongoose.connect(URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.log("MongoDB connection error:", err));

// ----------------------
// 4️⃣ Routes
// ----------------------
app.use("/api/user", userRoute);
app.use("/api/message", messageRoute);

// ----------------------
// 5️⃣ Start server
// ----------------------
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
