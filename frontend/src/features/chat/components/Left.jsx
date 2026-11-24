import React from "react";
import Search from "../private/components/sidebar/Search";
import Users from "../private/components/sidebar/Users";
import Profile from "../private/components/sidebar/Profile";

function Left() {
  return (
    <div className="w-full h-full min-h-0 flex flex-col overflow-hidden bg-gray-900 text-gray-300">

      {/* Fixed Search */}
      <div className="shrink-0">
        <Search />
      </div>

      {/* Messages Heading Fixed, User List Scrollable */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Users />
      </div>

      {/* Fixed Profile */}
      <div className="shrink-0">
        <Profile />
      </div>

    </div>
  );
}

export default Left;
