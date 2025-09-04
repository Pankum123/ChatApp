import React from "react";
import { IoSend } from "react-icons/io5";

function Typesend() {
  return (
    <div className="flex space-x-1 h-[8vh] bg-gray-800 ">
      <div className="w-[70%] mx-4">
      <input type="text" placeholder="Type here" className=" border border-gray-700 bg-black rounded-xl outline-none mt-1 px-4 py-3 w-full" />
      </div>
      <button>
        <IoSend className="text-3xl" />
      </button>
    </div>
  );
}

export default Typesend;
