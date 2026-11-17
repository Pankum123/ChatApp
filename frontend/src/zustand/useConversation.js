import { create } from "zustand";

const useConversation = create((set) => ({
  // Private Chat
  selectedConversation: null,
  setSelectedConversation: (selectedConversation) =>
    set({
      selectedConversation,
      selectedGroup: null,
      editingMessage: null,
      replyingMessage: null,
    }),

  // Group Chat
  selectedGroup: null,
  setSelectedGroup: (selectedGroup) =>
    set({
      selectedGroup,
      selectedConversation: null,
      editingMessage: null,
      replyingMessage: null,
    }),

  // Messages
  messages: [],
  setMessage: (messages) => set({ messages }),

  editingMessage: null,
  setEditingMessage: (editingMessage) => set({ editingMessage }),

  // Reply Message
  replyingMessage: null,
  setReplyingMessage: (replyingMessage) => set({ replyingMessage }),

  // Group Messages
  groupMessages: [],
  setGroupMessages: (groupMessages) =>
    set((state) => ({
      groupMessages:
        typeof groupMessages === "function"
          ? groupMessages(state.groupMessages)
          : groupMessages,
    })),

}));

export default useConversation;
