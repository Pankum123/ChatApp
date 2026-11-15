import React from "react";
import { IoClose } from "react-icons/io5";
import profile from "../../../../public/user.jpg";

function UserProfile({ user, onClose }) {
  if (!user) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-xl bg-slate-800 text-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full p-2 text-white hover:bg-slate-700"
          title="Close"
        >
          <IoClose size={24} />
        </button>

        {/* Profile Image */}
        <div className="flex flex-col items-center bg-slate-700 px-5 py-8">
          <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-slate-500">
            <img
              src={user?.profilePic?.url || profile}
              alt="User Profile"
              className="h-full w-full object-cover"
            />
          </div>

          <h2 className="mt-4 text-2xl font-semibold">
            {user.fullname}
          </h2>
        </div>

        {/* User Details */}
        <div className="space-y-5 p-5">
          <div>
            <p className="mb-1 text-sm font-medium text-green-400">
              Email
            </p>
            <p className="break-all text-gray-200">
              {user.email || "Not available"}
            </p>
          </div>

          <div className="border-t border-slate-600 pt-4">
            <p className="mb-1 text-sm font-medium text-green-400">
              About
            </p>
            <p className="break-words text-gray-200">
              {user.about || "Hey there! I am using ChatApp."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;