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


// ====== Group APIs ======
export const createGroupAPI = async (groupData) => {
  const response = await api.post("/group/create", groupData);
  return response;
};

// ===== all groups of the logged-in user ======
export const getGroupsAPI = async () => {
  const response = await api.get("/group/get");
  return response;
};

// ====== Group Messages APIs ======

export const getGroupMessagesAPI = async (groupId) => {
  if (!groupId) throw new Error("Group ID is required");

  const response = await api.get(`/group/messages/${groupId}`);
  return response;
};

export const sendGroupMessageAPI = async (groupId, message) => {
  if (!groupId) throw new Error("Group ID is required");

  const response = await api.post(`/group/send/${groupId}`, {
    message,
  });

  return response;
};

// ====== Add Member to Group API ======
export const addGroupMemberAPI = async (groupId, memberId) => {
  if (!groupId) throw new Error("Group ID is required");
  if (!memberId) throw new Error("Member ID is required");

  const response = await api.post(`/group/add-member/${groupId}`, {
    memberId,
  });

  return response;
};

// ====== Remove Member from Group API ======
export const removeGroupMemberAPI = async (groupId, memberId) => {
  if (!groupId) throw new Error("Group ID is required");
  if (!memberId) throw new Error("Member ID is required");

  const response = await api.post(`/group/remove-member/${groupId}`, {
    memberId,
  });

  return response;
};

//======== Delete Group Route ================
export const deleteGroupAPI = async (groupId) => {
  if (!groupId) throw new Error("Group ID is required");

  const response = await api.delete(`/group/delete/${groupId}`);

  return response;
};

// Export axios instance if needed elsewhere
export default api;
