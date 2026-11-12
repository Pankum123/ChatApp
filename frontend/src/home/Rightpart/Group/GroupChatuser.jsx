import React from "react";
import useConversation from "../../../zustand/useConversation.js";
import { CiMenuFries } from "react-icons/ci";

function GroupChatuser() {
  const { selectedGroup } = useConversation();

  return (
    <div className="relative flex items-center h-[8%] justify-center gap-4 bg-slate-800 hover:bg-slate-700 duration-300 rounded-md">

      {/* Mobile Menu */}
      <label
        htmlFor="my-drawer-2"
        className="btn btn-ghost drawer-button lg:hidden absolute left-5"
      >
        <CiMenuFries className="text-white text-xl" />
      </label>

      <div className="flex space-x-3 items-center justify-center h-[8vh] bg-gray-800 hover:bg-gray-700 duration-300">

        {/* Group Avatar */}
        <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-2xl">
          {selectedGroup?.groupName?.charAt(0)?.toUpperCase() || "G"}
        </div>

        {/* Group Details */}
        <div>
          <h1 className="text-xl">
            {selectedGroup?.groupName}
          </h1>

          <span className="text-sm">
            {selectedGroup?.members?.length || 0} Members
          </span>
        </div>

      </div>
    </div>
  );
}

export default GroupChatuser;