import React, { useState, useEffect, useMemo } from "react";
import User from "./User";
import useGetAllUsers from "../../hooks/useGetAllUsers.jsx";
import CreateGroup from "../../../group/components/sidebar/CreateGroup.jsx";
import { createGroupAPI } from "../../../../../shared/api.js";
import useGetGroups from "../../../../chat/group/hooks/useGetGroups.js";
import GroupItem from "../../../group/components/sidebar/GroupItem.jsx";
import { useSocketContext } from "../../../../../shared/realtime/SocketContext.jsx";
import useConversation from "../../../../../shared/zustand/useConversation.js";
import { useAuth } from "../../../../auth/context/AuthProvider.jsx";

function Users() {
  const [allUsers, loading, setAllUsers] = useGetAllUsers();
  const [groups, groupsLoading, setGroups] = useGetGroups();

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const { socket } = useSocketContext();
  const [authUser] = useAuth();

  const currentUserId = authUser?.user?._id;

  const { selectedGroup, setSelectedGroup } = useConversation();

  // Latest message ke according chats sort karna
  const combinedChats = useMemo(() => {
    const chats = [
      ...groups.map((group) => ({
        ...group,
        chatType: "group",
      })),

      ...allUsers.map((user) => ({
        ...user,
        chatType: "user",
      })),
    ];

    return chats.sort((a, b) => {
      const dateA = a.lastMessage?.createdAt
        ? new Date(a.lastMessage.createdAt).getTime()
        : 0;

      const dateB = b.lastMessage?.createdAt
        ? new Date(b.lastMessage.createdAt).getTime()
        : 0;

      return dateB - dateA;
    });
  }, [groups, allUsers]);

  // Private chat open hone par unread count reset
  useEffect(() => {
    const selectedConversation =
      useConversation.getState().selectedConversation;

    if (!selectedConversation?._id) return;

    setAllUsers((prevUsers) =>
      prevUsers.map((user) =>
        String(user._id) === String(selectedConversation._id)
          ? { ...user, unreadCount: 0 }
          : user
      )
    );
  }, [
    useConversation((state) => state.selectedConversation?._id),
    setAllUsers,
  ]);

  // Group chat open hone par unread count reset
  useEffect(() => {
    if (!selectedGroup?._id) return;

    setGroups((prevGroups) =>
      prevGroups.map((group) =>
        String(group._id) === String(selectedGroup._id)
          ? { ...group, unreadCount: 0 }
          : group
      )
    );
  }, [selectedGroup?._id, setGroups]);

  // Socket events
  useEffect(() => {
    if (!socket) return;

    // Private chat new message
    const handleNewMessage = (newMessage) => {
      const senderId =
        newMessage.senderId?._id || newMessage.senderId;

      const selectedConversation =
        useConversation.getState().selectedConversation;

      const isCurrentlyOpen =
        String(selectedConversation?._id) === String(senderId);

      setAllUsers((prevUsers) =>
        prevUsers.map((user) => {
          if (String(user._id) !== String(senderId)) {
            return user;
          }

          return {
            ...user,
            unreadCount: isCurrentlyOpen
              ? 0
              : (user.unreadCount || 0) + 1,
            lastMessage: newMessage,
          };
        })
      );
    };

    // Group chat new message
    const handleNewGroupMessage = (newMessage) => {
      const groupId =
        newMessage.groupId?._id || newMessage.groupId;

      const senderId =
        newMessage.senderId?._id || newMessage.senderId;

      const isOwnMessage =
        String(senderId) === String(currentUserId);

      const selectedGroup =
        useConversation.getState().selectedGroup;

      const isCurrentlyOpen =
        String(selectedGroup?._id) === String(groupId);

      setGroups((prevGroups) =>
        prevGroups.map((group) => {
          if (String(group._id) !== String(groupId)) {
            return group;
          }

          return {
            ...group,
            unreadCount:
              isOwnMessage || isCurrentlyOpen
                ? group.unreadCount || 0
                : (group.unreadCount || 0) + 1,
            lastMessage: newMessage,
          };
        })
      );
    };

    // New group create hone par
    const handleNewGroupCreated = (newGroup) => {
      if (newGroup?._id) {
        socket.emit(
          "joinGroup",
          { groupId: newGroup._id },
          (response) => {
            if (!response?.success) {
              console.log(
                "Group room join error:",
                response?.message
              );
            }
          }
        );
      }

      setGroups((prevGroups) => {
        const alreadyExists = prevGroups.some(
          (group) =>
            String(group._id) === String(newGroup._id)
        );

        if (alreadyExists) return prevGroups;

        return [
          ...prevGroups,
          {
            ...newGroup,
            unreadCount: 0,
          },
        ];
      });
    };

    // Group members update
    const handleGroupMembersUpdated = (data) => {
      const updatedGroup = data?.group || data;

      if (!updatedGroup?._id) return;

      setGroups((prevGroups) =>
        prevGroups.map((group) =>
          String(group._id) === String(updatedGroup._id)
            ? {
                ...updatedGroup,
                unreadCount: group.unreadCount || 0,
                lastMessage: group.lastMessage || null,
              }
            : group
        )
      );

      const selected =
        useConversation.getState().selectedGroup;

      if (String(selected?._id) === String(updatedGroup._id)) {
        setSelectedGroup(updatedGroup);
      }
    };

    // Group name / image update
    const handleGroupUpdated = (data) => {
      const updatedGroup = data?.group || data;

      if (!updatedGroup?._id) return;

      setGroups((prevGroups) =>
        prevGroups.map((group) =>
          String(group._id) === String(updatedGroup._id)
            ? {
                ...updatedGroup,
                unreadCount: group.unreadCount || 0,
                lastMessage: group.lastMessage || null,
              }
            : group
        )
      );

      const selected =
        useConversation.getState().selectedGroup;

      if (String(selected?._id) === String(updatedGroup._id)) {
        setSelectedGroup(updatedGroup);
      }
    };

    // Member remove hone par group remove
    const handleGroupRemoved = (data) => {
      const groupId =
        data?.groupId || data?._id || data;

      if (!groupId) return;

      setGroups((prevGroups) =>
        prevGroups.filter(
          (group) => String(group._id) !== String(groupId)
        )
      );

      const selected =
        useConversation.getState().selectedGroup;

      if (String(selected?._id) === String(groupId)) {
        setSelectedGroup(null);
      }
    };

    // Group delete hone par remove
    const handleGroupDeleted = (data) => {
      const groupId =
        data?.groupId || data?._id || data;

      if (!groupId) return;

      setGroups((prevGroups) =>
        prevGroups.filter(
          (group) => String(group._id) !== String(groupId)
        )
      );

      const selected =
        useConversation.getState().selectedGroup;

      if (String(selected?._id) === String(groupId)) {
        setSelectedGroup(null);
      }
    };

    // Socket listeners
    socket.on("newMessage", handleNewMessage);
    socket.on("newGroupMessage", handleNewGroupMessage);
    socket.on("newGroupCreated", handleNewGroupCreated);
    socket.on("groupMembersUpdated", handleGroupMembersUpdated);
    socket.on("groupUpdated", handleGroupUpdated);
    socket.on("groupRemoved", handleGroupRemoved);
    socket.on("groupDeleted", handleGroupDeleted);

    // Cleanup
    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("newGroupMessage", handleNewGroupMessage);
      socket.off("newGroupCreated", handleNewGroupCreated);
      socket.off("groupMembersUpdated", handleGroupMembersUpdated);
      socket.off("groupUpdated", handleGroupUpdated);
      socket.off("groupRemoved", handleGroupRemoved);
      socket.off("groupDeleted", handleGroupDeleted);
    };
  }, [
    socket,
    currentUserId,
    setAllUsers,
    setGroups,
    setSelectedGroup,
  ]);

  // Create group
  const handleCreateGroup = async (groupData) => {
    try {
      setCreatingGroup(true);

      const response = await createGroupAPI(groupData);

      console.log(
        "Group Created Successfully:",
        response.data
      );

      setGroups((prevGroups) => {
        const alreadyExists = prevGroups.some(
          (group) =>
            String(group._id) === String(response.data._id)
        );

        if (alreadyExists) return prevGroups;

        return [
          ...prevGroups,
          {
            ...response.data,
            unreadCount: 0,
          },
        ];
      });

      setShowCreateGroup(false);
    } catch (error) {
      console.log(
        "Group Creation Error:",
        error.response?.data || error.message
      );
    } finally {
      setCreatingGroup(false);
    }
  };

  return (
    <div>
      {/* Sidebar Header */}
      <div className="px-4 py-2 flex items-center justify-between text-white font-semibold bg-slate-800 rounded-md">
        <h1>Messages</h1>

        <button
          type="button"
          onClick={() => setShowCreateGroup(true)}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md flex items-center gap-1"
        >
          <span className="text-2xl font-bold leading-none">
            +
          </span>
          New Group
        </button>
      </div>

      {/* Combined Chat List */}
      <div
        className="py-2 flex-1 overflow-y-auto"
        style={{ maxHeight: "calc(84vh - 10vh)" }}
      >
        {combinedChats.map((chat) =>
          chat.chatType === "group" ? (
            <GroupItem
              key={`group-${chat._id}`}
              group={chat}
            />
          ) : (
            <User
              key={`user-${chat._id}`}
              user={chat}
            />
          )
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <CreateGroup
          allUsers={allUsers}
          onClose={() => setShowCreateGroup(false)}
          onCreate={handleCreateGroup}
        />
      )}
    </div>
  );
}

export default Users;
