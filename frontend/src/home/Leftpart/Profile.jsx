
import React, { useState } from "react";
import { useAuth } from "../../context/AuthProvider";
import profile from "../../../public/user.jpg";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { logoutUser, updateProfilePicAPI, updateFullnameAPI, updateAboutAPI } from "../../api";
import { FaPencilAlt } from "react-icons/fa";

function Profile() {
  const [authUser, setAuthUser] = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  const [editing, setEditing] = useState("");
  const [fullname, setFullname] = useState(authUser?.user?.fullname || "");
  const [about, setAbout] = useState(authUser?.user?.about || "");

  const user = authUser?.user;
  const profilePic = user?.profilePic?.url;

  // Update auth user and localStorage
  const updateLocalUser = (updatedUser) => {
    const updatedAuthUser = {
      ...authUser,
      user: {
        ...user,
        ...updatedUser,
      },
    };

    setAuthUser(updatedAuthUser);
    localStorage.setItem("ChatApp", JSON.stringify(updatedAuthUser));
  };

  // Change Profile Photo
  const handleProfilePic = async (e) => {
    const image = e.target.files[0];
    if (!image) return;

    try {
      setLoading(true);
      const response = await updateProfilePicAPI(image);

      updateLocalUser(response.data.user);
      toast.success("Profile photo updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.errors || "Photo update failed");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  // Update Name
  const handleNameUpdate = async () => {
    if (!fullname.trim()) {
      return toast.error("Name is required");
    }

    try {
      setLoading(true);
      const response = await updateFullnameAPI(fullname);

      updateLocalUser(response.data.user);
      setEditing("");
      toast.success("Name updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.errors || "Name update failed");
    } finally {
      setLoading(false);
    }
  };

  // Update About
  const handleAboutUpdate = async () => {
    try {
      setLoading(true);
      const response = await updateAboutAPI(about);

      updateLocalUser(response.data.user);
      setEditing("");
      toast.success("About updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.errors || "About update failed");
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      setLoading(true);
      await logoutUser();

      localStorage.removeItem("ChatApp");
      Cookies.remove("jwt");

      toast.success("Logged out successfully");
      window.location.reload();
    } catch (error) {
      console.log("Error in Logout:", error);
      toast.error("Error in logging out");
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Profile Button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="ml-3 mt-2 focus:outline-none"
      >
        <img
          src={profilePic || profile}
          alt="Profile"
          className="w-12 h-12 rounded-full object-cover border-2 border-gray-500"
        />
      </button>

      {/* Profile Popup */}
      {showMenu && (
        <div className="absolute bottom-16 left-2 z-50 w-72 bg-gray-800 text-white rounded-xl shadow-xl p-4">

          <h2 className="text-lg font-semibold mb-4">Profile</h2>

          {/* Profile Photo */}
          <div className="flex justify-center items-center gap-3 mb-4">
            <img
              src={profilePic || profile}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-500"
            />

            <label className="cursor-pointer p-2 rounded-full hover:bg-gray-700">
              <FaPencilAlt />
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleProfilePic}
              />
            </label>
          </div>

          {/* Name */}
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-400">Name</span>
              <button
                onClick={() => setEditing(editing === "name" ? "" : "name")}
                className="p-2 hover:bg-gray-700 rounded-full"
              >
                <FaPencilAlt size={13} />
              </button>
            </div>

            {editing === "name" ? (
              <div>
                <input
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  maxLength={50}
                  className="w-full bg-gray-700 p-2 rounded mt-1 outline-none"
                />
                <button
                  onClick={handleNameUpdate}
                  disabled={loading}
                  className="mt-2 bg-green-600 px-3 py-1 rounded"
                >
                  Save
                </button>
              </div>
            ) : (
              <p className="text-white">{user?.fullname}</p>
            )}
          </div>

          {/* About */}
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-400">About</span>
              <button
                onClick={() => setEditing(editing === "about" ? "" : "about")}
                className="p-2 hover:bg-gray-700 rounded-full"
              >
                <FaPencilAlt size={13} />
              </button>
            </div>

            {editing === "about" ? (
              <div>
                <textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  maxLength={100}
                  className="w-full bg-gray-700 p-2 rounded mt-1 outline-none resize-none"
                  rows={3}
                />
                <button
                  onClick={handleAboutUpdate}
                  disabled={loading}
                  className="mt-2 bg-green-600 px-3 py-1 rounded"
                >
                  Save
                </button>
              </div>
            ) : (
              <p className="text-gray-300 break-words">
                {user?.about || "Hey there! I am using ChatApp."}
              </p>
            )}
          </div>

          <hr className="border-gray-600 my-3" />

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full text-left p-2 text-red-400 hover:bg-gray-700 rounded"
          >
            {loading ? "Please wait..." : "Logout"}
          </button>
        </div>
      )}
    </div>
  );
}

export default Profile;
