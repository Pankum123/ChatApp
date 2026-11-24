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


// ===== Google Login API =====
export const googleLoginAPI = async (idToken) => {
  if (!idToken) {
    throw new Error("Google ID token is required");
  }

  const response = await api.post("/google-auth/login", {
    idToken,
  });

  return response;
};

// Set Password API
export const setPasswordAPI = async (password, confirmPassword) => {
  const response = await api.put("/user/set-password", {
    password,
    confirmPassword,
  });
  return response;
};


// Get all users API
export const getAllUsers = async () => {
  const response = await api.get("/user/allusers");
  return response;
};


// ====== Messages API ======
export const getMessagesByConversation = async (conversationId) => {
  if (!conversationId) throw new Error("Conversation ID is required");
  const res = await api.get(`/message/get/${conversationId}`);
  return res;
};

// ====== Messages API ======
export const sendMessageToConversation = async (
  conversationId,
  message = "",
  attachments = [],
  replyTo = null
) => {
  if (!conversationId) {
    throw new Error("Conversation ID is required");
  }

  let payload;
  let config = {};

  if (attachments.length > 0) {
    const formData = new FormData();

    formData.append("message", message);

    if (replyTo) {
      formData.append("replyTo", replyTo);
    }

    attachments.forEach((file) => {
      formData.append("attachments", file);
    });

    payload = formData;

    config.headers = {
      "Content-Type": undefined,
    };
  } else {
    payload = {
      message,
      replyTo,
    };
  }

  return api.post(
    `/message/send/${conversationId}`,
    payload,
    config
  );
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



export const sendGroupMessageAPI = async (
  groupId,
  message = "",
  attachments = [],
  replyTo = null
) => {
  if (!groupId) {
    throw new Error("Group ID is required");
  }

  let payload;
  let config = {};

  if (attachments.length > 0) {
    const formData = new FormData();

    formData.append("message", message);

    if (replyTo) {
      formData.append("replyTo", replyTo);
    }

    attachments.forEach((file) => {
      formData.append("attachments", file);
    });

    payload = formData;

    config.headers = {
      "Content-Type": undefined,
    };
  } else {
    payload = {
      message,
      replyTo,
    };
  }

  return api.post(
    `/group/send/${groupId}`,
    payload,
    config
  );
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

// Leave Group API
export const leaveGroupAPI = async (groupId) => {
  if (!groupId) throw new Error("Group ID is required");

  const response = await api.post(`/group/leave/${groupId}`);

  return response;
};

// Edit Group Name API
export const editGroupAPI = async (groupId, groupName) => {
  if (!groupId) throw new Error("Group ID is required");

  const response = await api.put(`/group/edit/${groupId}`, {
    groupName,
  });

  return response;
};

// ====== Update Group Image API ======
export const updateGroupImageAPI = async (groupId, image) => {
  if (!groupId) throw new Error("Group ID is required");
  if (!image) throw new Error("Group image is required");

  const formData = new FormData();
  formData.append("image", image);

  const response = await api.put(
    `/group/update-image/${groupId}`,
    formData,
    {
      headers: {
        "Content-Type": undefined,
      },
    }
  );

  return response;
};

// ====== User Profile APIs ======

// Update Profile Photo API
// ====== Update User Profile Photo API ======
export const updateProfilePicAPI = async (image) => {
  if (!image) throw new Error("Profile image is required");

  const formData = new FormData();
  formData.append("image", image);

  const response = await api.put(
    "/user/update-profile-pic",
    formData,
    {
      headers: {
        "Content-Type": undefined,
      },
    }
  );

  return response;
};

// Update Full Name API
export const updateFullnameAPI = async (fullname) => {
  const response = await api.put("/user/update-fullname", {
    fullname,
  });
  return response;
};

// Update About API
export const updateAboutAPI = async (about) => {
  const response = await api.put("/user/update-about", {
    about,
  });
  return response;
};


// ===== Delete Private Message APIs =====

// Delete message for me
export const deleteMessageForMeAPI = async (messageId) => {
  if (!messageId) throw new Error("Message ID is required");

  const response = await api.delete(
    `/message/delete-for-me/${messageId}`
  );

  return response;
};

// Delete message for everyone
export const deleteMessageForEveryoneAPI = async (messageId) => {
  if (!messageId) throw new Error("Message ID is required");

  const response = await api.delete(
    `/message/delete-for-everyone/${messageId}`
  );

  return response;
};


// Edit message API
export const editMessageAPI = async (messageId, message) => {
  if (!messageId) throw new Error("Message ID is required");

  if (!message || !message.trim()) {
    throw new Error("Message cannot be empty");
  }

  const response = await api.put(`/message/edit/${messageId}`, {
    message: message.trim(),
  });

  return response;
};

// ====== Delete Group Message APIs ======

// Delete group message for me
export const deleteGroupMessageForMeAPI = async (groupId, messageId) => {
  if (!groupId) throw new Error("Group ID is required");
  if (!messageId) throw new Error("Message ID is required");

  const response = await api.delete(
    `/group/delete-message-for-me/${groupId}/${messageId}`
  );

  return response;
};

// Delete group message for everyone
export const deleteGroupMessageForEveryoneAPI = async (groupId, messageId) => {
  if (!groupId) throw new Error("Group ID is required");
  if (!messageId) throw new Error("Message ID is required");

  const response = await api.delete(
    `/group/delete-message-for-everyone/${groupId}/${messageId}`
  );

  return response;
};

// Edit Group Message API
export const editGroupMessageAPI = async (groupId, messageId, message) => {
  if (!groupId) throw new Error("Group ID is required");
  if (!messageId) throw new Error("Message ID is required");

  const response = await api.put(
    `/group/edit-message/${groupId}/${messageId}`,
    { message }
  );

  return response;
};

// Forward message to Private Chat
export const forwardMessageAPI = async (
  receiverId,
  messageId,
  sourceType = "private"
) => {
  if (!receiverId || !messageId) {
    throw new Error("Receiver ID and Message ID are required");
  }

  return await api.post(`/message/forward/${receiverId}`, {
    messageId,
    sourceType,
  });
};

// Forward message to Group Chat
export const forwardGroupMessageAPI = async (
  groupId,
  messageId,
  sourceType = "private"
) => {
  if (!groupId || !messageId) {
    throw new Error("Group ID and Message ID are required");
  }

  return await api.post(`/group/forward/${groupId}`, {
    messageId,
    sourceType,
  });
};

// Export axios instance if needed elsewhere
export default api;
