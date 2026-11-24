import React, { useState, useRef, useEffect } from "react";
import { IoSend, IoAttach } from "react-icons/io5";
import { MdClose, MdReply, MdInsertDriveFile } from "react-icons/md";

import useSendMessage from "../../hooks/useSendMessage.js";
import { useSocketContext } from "../../../../../shared/realtime/SocketContext.jsx";
import useConversation from "../../../../../shared/zustand/useConversation.js";
import { editMessageAPI } from "../../../../../shared/api.js";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

const ACCEPTED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];

const isSupportedFile = (file) =>
  ACCEPTED_FILE_TYPES.includes(file.type) ||
  file.type.startsWith("video/") ||
  file.type.startsWith("audio/");

function Typesend() {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileError, setFileError] = useState("");
  const [previews, setPreviews] = useState([]);
  const [editLoading, setEditLoading] = useState(false);

  const { loading, sendMessages } = useSendMessage();
  const { socket } = useSocketContext();

  const {
    selectedConversation,
    messages,
    setMessage: setMessages,
    editingMessage,
    setEditingMessage,
    replyingMessage,
    setReplyingMessage,
  } = useConversation();

  const typingTimeout = useRef(null);
  const isTyping = useRef(false);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const receiverId = selectedConversation?._id;

  // Load message into input when editing
  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.message || "");
      setSelectedFiles([]);
      setReplyingMessage(null);
      inputRef.current?.focus();
    }
  }, [editingMessage, setReplyingMessage]);

  // Focus input when replying
  useEffect(() => {
    if (replyingMessage) {
      inputRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });

      inputRef.current?.focus();
    }
  }, [replyingMessage]);

  // Generate and cleanup image previews
  useEffect(() => {
    const nextPreviews = selectedFiles.map((file) => ({
      file,
      url: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null,
    }));

    setPreviews(nextPreviews);

    return () => {
      nextPreviews.forEach(({ url }) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [selectedFiles]);

  // Stop typing event
  const stopTyping = () => {
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
      typingTimeout.current = null;
    }

    if (isTyping.current && socket && receiverId) {
      socket.emit("stopTyping", { receiverId });
      isTyping.current = false;
    }
  };

  // Handle input change
  const handleChange = (event) => {
    const value = event.target.value;
    setMessage(value);

    if (editingMessage) return;

    if (!value.trim()) {
      stopTyping();
      return;
    }

    if (socket && receiverId) {
      if (!isTyping.current) {
        socket.emit("typing", { receiverId });
        isTyping.current = true;
      }

      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }

      typingTimeout.current = setTimeout(stopTyping, 1500);
    }
  };

  // Handle file selection
  const handleFileSelection = (event) => {
    const incomingFiles = Array.from(event.target.files || []);

    event.target.value = "";
    setFileError("");

    if (!incomingFiles.length) return;

    if (selectedFiles.length + incomingFiles.length > MAX_FILES) {
      setFileError(`You can attach up to ${MAX_FILES} files per message.`);
      return;
    }

    const invalidFile = incomingFiles.find(
      (file) => !isSupportedFile(file)
    );

    if (invalidFile) {
      setFileError(`File type not supported: ${invalidFile.name}`);
      return;
    }

    const oversizedFile = incomingFiles.find(
      (file) => file.size > MAX_FILE_SIZE
    );

    if (oversizedFile) {
      setFileError(`${oversizedFile.name} exceeds the 20 MB limit.`);
      return;
    }

    setSelectedFiles((currentFiles) => [
      ...currentFiles,
      ...incomingFiles,
    ]);
  };

  // Remove selected file
  const removeSelectedFile = (fileToRemove) => {
    setSelectedFiles((currentFiles) =>
      currentFiles.filter((file) => file !== fileToRemove)
    );
  };

  // Send or update message
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading || editLoading) return;

    // Update existing message
    if (editingMessage) {
      if (!message.trim()) return;

      try {
        setEditLoading(true);

        const response = await editMessageAPI(
          editingMessage._id,
          message
        );

        const editedMessage = response.data.editedMessage;

        setMessages(
          messages.map((item) =>
            item._id === editingMessage._id
              ? { ...item, ...editedMessage }
              : item
          )
        );

        setMessage("");
        setEditingMessage(null);
      } catch (error) {
        console.error("Edit message error:", error);
      } finally {
        setEditLoading(false);
      }

      return;
    }

    // Validate message
    if (!message.trim() && selectedFiles.length === 0) {
      return;
    }

    stopTyping();

    // Send message with attachments and reply
    const sent = await sendMessages(
      message,
      selectedFiles,
      replyingMessage?._id || null
    );

    if (sent) {
      setMessage("");
      setSelectedFiles([]);
      setFileError("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setMessage("");
    setEditingMessage(null);
  };

  // Cancel reply
  const handleCancelReply = () => {
    setReplyingMessage(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }

      if (isTyping.current && socket && receiverId) {
        socket.emit("stopTyping", { receiverId });
      }
    };
  }, [socket, receiverId]);

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800">

      {/* Reply Preview */}
      {replyingMessage && !editingMessage && (
        <div className="flex items-center justify-between bg-[#202c33] border-l-4 border-green-500 px-4 py-2 mx-2 rounded-t-lg">
          <div className="flex items-center gap-2 overflow-hidden">
            <MdReply className="text-green-400 text-xl shrink-0" />

            <div className="overflow-hidden">
              <p className="text-green-400 text-sm font-semibold">
                Replying to message
              </p>

              <p className="text-gray-300 text-sm truncate">
                {replyingMessage.isDeleted
                  ? "This message was deleted"
                  : replyingMessage.message ||
                    (replyingMessage.attachments?.length
                      ? "Attachment"
                      : "Message")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCancelReply}
            className="text-gray-400 hover:text-white p-1"
            aria-label="Cancel reply"
          >
            <MdClose size={22} />
          </button>
        </div>
      )}

      {/* Selected Files Preview */}
      {previews.length > 0 && !editingMessage && (
        <div className="flex flex-wrap gap-2 px-4 pt-3">
          {previews.map(({ file, url }) => (
            <div
              key={`${file.name}-${file.lastModified}-${file.size}`}
              className="relative flex items-center gap-2 bg-[#202c33] border border-gray-600 rounded-lg p-2 max-w-[220px]"
            >
              {url ? (
                <img
                  src={url}
                  alt={file.name}
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <MdInsertDriveFile className="text-2xl text-gray-300 shrink-0" />
              )}

              <div className="min-w-0">
                <p className="text-white text-xs truncate">
                  {file.name}
                </p>

                <p className="text-gray-400 text-xs">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeSelectedFile(file)}
                className="text-gray-300 hover:text-white"
                aria-label={`Remove ${file.name}`}
              >
                <MdClose size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* File Error */}
      {fileError && (
        <p className="px-4 pt-2 text-sm text-red-400" role="alert">
          {fileError}
        </p>
      )}

      {/* Message Input */}
      <div className="flex items-center gap-2 min-h-[8vh] px-3">

        {/* Attachment Button */}
        {!editingMessage && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/gif,image/webp,video/*,audio/*,application/pdf"
              onChange={handleFileSelection}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || selectedFiles.length >= MAX_FILES}
              title="Attach files"
              aria-label="Attach files"
              className="text-gray-300 hover:text-white disabled:opacity-40"
            >
              <IoAttach className="text-2xl" />
            </button>
          </>
        )}

        {/* Text Input */}
        <div className="flex-1">
          <input
            ref={inputRef}
            type="text"
            placeholder={
              editingMessage ? "Edit message..." : "Type here"
            }
            value={message}
            onChange={handleChange}
            className="border border-gray-700 rounded-xl outline-none px-4 py-3 w-full bg-gray-900 text-white"
          />
        </div>

        {/* Cancel Edit */}
        {editingMessage && (
          <button
            type="button"
            onClick={handleCancelEdit}
            className="text-gray-300 px-2"
          >
            Cancel
          </button>
        )}

        {/* Send Button */}
        <button
          type="submit"
          disabled={
            loading ||
            editLoading ||
            (!message.trim() && selectedFiles.length === 0)
          }
          className="flex items-center text-white disabled:opacity-40"
          aria-label={editingMessage ? "Update message" : "Send message"}
        >
          {editingMessage ? (
            <span className="text-green-400 font-semibold px-2">
              Update
            </span>
          ) : (
            <IoSend className="text-3xl" />
          )}
        </button>
      </div>
    </form>
  );
}

export default Typesend;
