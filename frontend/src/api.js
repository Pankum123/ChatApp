// src/api.js
import axios from "axios";
import Cookies from "js-cookie";

// Base URL from environment variables
const API_URL = import.meta.env.VITE_API_URL;

// Axios instance with centralized config
const api = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "/api" : `${API_URL}/api`,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // cookies handling
});

// ====== Auth / User APIs ======

// Signup API
export const signupUser = async (userInfo) => {
  const response = await api.post("/user/signup", userInfo);
  return response;
};

// Login API
export const loginUser = async (credentials) => {
  const response = await api.post("/user/login", credentials);
  return response;
};

// Logout API
export const logoutUser = async () => {
  const response = await api.post("/user/logout");
  return response;
};

// Get all users API
export const getAllUsers = async () => {
  const token = Cookies.get("jwt"); // get token like in your hook
  const res = await api.get("/user/allusers", {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res;
};


// ====== Messages API ======
export const getMessagesByConversation = async (conversationId) => {
  if (!conversationId) throw new Error("Conversation ID is required");
  const res = await api.get(`/message/get/${conversationId}`);
  return res;
};

// ====== Messages API ======
export const sendMessageToConversation = async (conversationId, message) => {
  if (!conversationId) throw new Error("Conversation ID is required");
  const res = await api.post(`/message/send/${conversationId}`, { message });
  return res;
};

// Export axios instance if needed elsewhere
export default api;
