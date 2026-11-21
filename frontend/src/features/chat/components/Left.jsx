import React from "react";
import Search from "../../../home/Leftpart/Search";
import Users from "../../../home/Leftpart/Users";
import Profile from "../../../home/Leftpart/Profile";

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
