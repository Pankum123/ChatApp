import React from "react";

function User() {
  return (
    <div>
      <div className="flex space-x-4 px-8 py-3 hover:bg-slate-700 duration-300 cursor-pointer">
        <div className="avatar">
          <div className="w-15 rounded-full">
            <img src="https://img.daisyui.com/images/profile/demo/spiderperson@192.webp" />
          </div>
        </div>
        <div>
          <h1 className="font-bold">Pankaj</h1>
          <span>panko@123.com</span>clear
        </div>
      </div>
    </div>
  );
}

export default User;
