import React from "react";
import Chatuser from "./Chatuser";
import Messages from "./Messages";
import Typesend from "./Typesend";
import GroupChatuser from "./Group/GroupChatuser";
import GroupMessages from "./Group/GroupMessages";
import GroupTypesend from "./Group/GroupTypesend";
import useConversation from "../../zustand/useConversation.js";
import { useAuth } from "../../context/AuthProvider.jsx";
import { CiMenuFries } from "react-icons/ci";

function Right() {
  const { selectedConversation, selectedGroup } = useConversation();

  return (
    <div className="w-full bg-slate-900 text-gray-300">
      <div>
        {!selectedConversation && !selectedGroup ? (
          <NoChatSelected />
        ) : selectedConversation ? (
          <>
            {/* Private Chat - Existing UI */}
            <Chatuser />

            <div
              className="flex-1 overflow-y-auto"
              style={{ maxHeight: "calc(92vh - 8vh)" }}
            >
              <Messages />
            </div>

            <Typesend />
          </>
        ) : (
          <>
            {/* Group Chat - New UI */}
            <GroupChatuser />

            <div
              className="flex-1 overflow-y-auto"
              style={{ maxHeight: "calc(92vh - 8vh)" }}
            >
              <GroupMessages />
            </div>

            <GroupTypesend />
          </>
        )}
      </div>
    </div>
  );
}

export default Right;

const NoChatSelected = () => {
  const [authUser] = useAuth();

  return (
    <>
      <div className="relative">
        <label
          htmlFor="my-drawer-2"
          className="btn btn-ghost drawer-button lg:hidden absolute left-5"
        >
          <CiMenuFries className="text-white text-xl" />
        </label>

        <div className="flex h-screen items-center justify-center">
          <h1 className="text-center">
            Welcome{" "}
            <span className="font-semibold text-xl">
              {authUser.user.fullname}
            </span>
            <br />
            No chat selected, please start conversation by selecting anyone to
            your contacts
          </h1>
        </div>
      </div>
    </>
  );
};
