import React from "react";
import Chatuser from "../private/components/conversation/Chatuser.jsx";
import Messages from "../private/components/conversation/Messages.jsx";
import Typesend from "../private/components/conversation/Typesend.jsx";
import GroupChatuser from "../group/components/conversation/GroupChatuser.jsx";
import GroupMessages from "../group/components/conversation/GroupMessages.jsx";
import GroupTypesend from "../group/components/conversation/GroupTypesend.jsx";
import useConversation from "../../../shared/zustand/useConversation.js";
import { useAuth } from "../../auth/context/AuthProvider.jsx";
import { CiMenuFries } from "react-icons/ci";

function Right() {
  const { selectedConversation, selectedGroup } = useConversation();

  return (
    <div className="w-full h-full min-h-0 flex flex-col overflow-hidden bg-slate-900 text-gray-300">
      {!selectedConversation && !selectedGroup ? (
        <NoChatSelected />
      ) : selectedConversation ? (
        <>
          {/* Private Chat Header */}
          <div className="shrink-0">
            <Chatuser />
          </div>

          {/* Private Messages - Scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
            <Messages />
          </div>

          {/* Private Message Input - Fixed Bottom */}
          <div className="shrink-0">
            <Typesend />
          </div>
        </>
      ) : (
        <>
          {/* Group Chat Header */}
          <div className="shrink-0">
            <GroupChatuser />
          </div>

          {/* Group Messages - Scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
            <GroupMessages />
          </div>

          {/* Group Message Input - Fixed Bottom */}
          <div className="shrink-0">
            <GroupTypesend />
          </div>
        </>
      )}
    </div>
  );
}

export default Right;

const NoChatSelected = () => {
  const [authUser] = useAuth();

  return (
    <div className="relative flex-1 min-h-0 flex items-center justify-center">
      <label
        htmlFor="my-drawer-2"
        className="btn btn-ghost drawer-button lg:hidden absolute left-5 top-4"
      >
        <CiMenuFries className="text-white text-xl" />
      </label>

      <h1 className="text-center px-4">
        Welcome{" "}
        <span className="font-semibold text-xl">
          {authUser.user.fullname}
        </span>
        <br />
        No chat selected, please start conversation by selecting anyone to
        your contacts
      </h1>
    </div>
  );
};
