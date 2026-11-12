import React, { useState } from "react";
import User from "./User";
import useGetAllUsers from "../../context/useGetAllUsers";
import CreateGroup from "./Group/CreateGroup";
import { createGroupAPI } from "../../api";

function Users() {
  const [allUsers, loading] = useGetAllUsers();
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);

  console.log(allUsers);

  const handleCreateGroup = async (groupData) => {
    try {
      setCreatingGroup(true);

      const response = await createGroupAPI(groupData);

      console.log("Group Created Successfully:", response.data);

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
