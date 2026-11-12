
import React, { useState, useEffect } from "react";
import User from "./User";
import useGetAllUsers from "../../context/useGetAllUsers";
import CreateGroup from "./Group/CreateGroup";
import { createGroupAPI } from "../../api";
import useGetGroups from "../../context/Group/useGetGroups";
import GroupItem from "./Group/GroupItem";
import { useSocketContext } from "../../context/SocketContext.jsx";

function Users() {
  const [allUsers, loading] = useGetAllUsers();
  const [groups, groupsLoading, setGroups] = useGetGroups();

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const { socket } = useSocketContext();

  // Real-time mein naye group receive karna
  useEffect(() => {
    if (!socket) return;

    const handleNewGroupCreated = (newGroup) => {
      setGroups((prevGroups) => {
        const alreadyExists = prevGroups.some(
          (group) => group._id === newGroup._id
        );

        if (alreadyExists) return prevGroups;

        return [newGroup, ...prevGroups];
      });
    };

    socket.on("newGroupCreated", handleNewGroupCreated);

    return () => {
      socket.off("newGroupCreated", handleNewGroupCreated);
    };
  }, [socket, setGroups]);

  // Group create karna
  const handleCreateGroup = async (groupData) => {
    try {
      setCreatingGroup(true);

      const response = await createGroupAPI(groupData);

      console.log("Group Created Successfully:", response.data);

      setGroups((prevGroups) => {
        const alreadyExists = prevGroups.some(
          (group) => group._id === response.data._id
        );

        if (alreadyExists) return prevGroups;

        return [response.data, ...prevGroups];
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
      <div className="px-4 py-2 flex items-center justify-between text-white font-semibold bg-slate-800 rounded-md">
        <h1>Messages</h1>

        <button
          type="button"
          onClick={() => setShowCreateGroup(true)}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md flex items-center gap-1"
        >
          <span className="text-2xl font-bold leading-none">+</span>
          New Group
        </button>
      </div>

      <div
        className="py-2 flex-1 overflow-y-auto"
        style={{ maxHeight: "calc(84vh - 10vh)" }}
      >
        {/* Groups */}
        {groups.map((group) => (
          <GroupItem key={group._id} group={group} />
        ))}

        {/* Individual Users */}
        {allUsers.map((user, index) => (
          <User key={index} user={user} />
        ))}
      </div>

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
