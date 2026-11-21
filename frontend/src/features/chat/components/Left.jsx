import React from "react";
import Search from "../private/components/sidebar/Search";
import Users from "../private/components/sidebar/Users";
import Profile from "../private/components/sidebar/Profile";

function Left() {
  return (
    <div className="w-full bg-gray-900 text-gray-300">
      <Search />
      <div
        className=" flex-1  overflow-y-auto"
        style={{ minHeight: "calc(84vh - 10vh)" }}
      >
        <Users />
      </div>
      {/* <Logout /> */}
      <Profile/>
    </div>
  );
}

export default Left;
