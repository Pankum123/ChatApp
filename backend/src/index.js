import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import dns from "node:dns/promises";

import { app, server } from "./sockets/server.js"; // use this app
import userRoute from "./modules/user/user.route.js";
import messageRoute from "./modules/message/message.route.js";
import groupRoute  from "./modules/group/group.route.js"

import cloudinary from "./config/cloudinary.js";

dotenv.config();

if (process.env.NODE_ENV !== "production") {
  dns.setServers(["1.1.1.1", "8.8.8.8"]);
  console.log("Local DNS Servers set.");
}

// ----------------------
// CORS middleware (before routes)
// ----------------------
const allowedOrigins = [
  "http://localhost:3001",
  "https://chatapp-pankaj-j656.onrender.com"
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"), false);
    }
  },
  credentials: true,
  methods: ["GET","POST","PUT","DELETE"]
}));

app.use(express.json());
app.use(cookieParser());

// MongoDB connection
const PORT = process.env.PORT || 4001;
const URI = process.env.MONGODB_URI;

mongoose.connect(URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.log("MongoDB connection error:", err));

// Cloudinary connection test
cloudinary.api.ping()
  .then(() => {
    console.log("Cloudinary connected successfully!");
  })
  .catch(error => {
    console.log("Cloudinary connection failed:", error.message);
  });

// Routes
app.use("/api/user", userRoute);
app.use("/api/message", messageRoute);
app.use("/api/group", groupRoute);

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
