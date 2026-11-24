import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../../auth/context/AuthProvider";
import profile from "../../../../../../public/user.jpg";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

import {
  logoutUser,
  updateProfilePicAPI,
  updateFullnameAPI,
  updateAboutAPI,
  setPasswordAPI,
} from "../../../../../shared/api";

import { FaPencilAlt } from "react-icons/fa";

function Profile() {
  const [authUser, setAuthUser] = useAuth();

  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  const [editing, setEditing] = useState("");

  const [fullname, setFullname] = useState(
    authUser?.user?.fullname || ""
  );

  const [about, setAbout] = useState(
    authUser?.user?.about || ""
  );

  // Set Password States
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const profileRef = useRef(null);

  const user = authUser?.user;
  const profilePic = user?.profilePic?.url;

  // Close popup on outside click
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

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
      toast.error(
        error.response?.data?.errors || "Photo update failed"
      );
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
      toast.error(
        error.response?.data?.errors || "Name update failed"
      );
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
      toast.error(
        error.response?.data?.errors || "About update failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // Set Password
  const handleSetPassword = async () => {
    if (!password || !confirmPassword) {
      return toast.error("Please fill both password fields");
    }

    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    if (password.length < 8) {
      return toast.error("Password must be at least 8 characters");
    }

    try {
      setLoading(true);

      const response = await setPasswordAPI(
        password,
        confirmPassword
      );

      updateLocalUser(response.data.user);

      setPassword("");
      setConfirmPassword("");
      setShowSetPassword(false);

      toast.success("Password set successfully");
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Unable to set password"
      );
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
    <div className="relative shrink-0 px-2 text-white font-semibold bg-slate-800 rounded-md" ref={profileRef}>

      {/* Profile Button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="ml-2 mt-2 focus:outline-none"
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

          <h2 className="text-lg font-semibold mb-4">
            Profile
          </h2>

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
              <span className="text-sm text-green-400">
                Name
              </span>

              <button
                onClick={() =>
                  setEditing(editing === "name" ? "" : "name")
                }
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
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            ) : (
              <p className="text-white">
                {user?.fullname}
              </p>
            )}
          </div>

          {/* About */}
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-400">
                About
              </span>

              <button
                onClick={() =>
                  setEditing(editing === "about" ? "" : "about")
                }
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
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            ) : (
              <p className="text-gray-300 break-words">
                {user?.about || "Hey there! I am using ChatApp."}
              </p>
            )}
          </div>

          {/* Email - Read Only */}
          <div className="mt-4 mb-4 border-t border-gray-600 pt-3">
            <span className="text-sm text-gray-400">
              Email
            </span>

            <p className="text-white break-all mt-1">
              {user?.email || "Email not available"}
            </p>
          </div>

          {/* Set Password */}
          {user?.passwordLoginEnabled === false && (
            <div className="mb-4 border-t border-gray-600 pt-3">

              {!showSetPassword ? (
                <button
                  onClick={() => setShowSetPassword(true)}
                  className="w-full text-left p-2 text-green-400 hover:bg-gray-700 rounded"
                >
                  Set Password
                </button>
              ) : (
                <div className="space-y-3">

                  <h3 className="text-green-400 font-semibold">
                    Set Your Password
                  </h3>

                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-700 p-2 rounded outline-none"
                  />

                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    className="w-full bg-gray-700 p-2 rounded outline-none"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={handleSetPassword}
                      disabled={loading}
                      className="bg-green-600 px-3 py-2 rounded"
                    >
                      {loading ? "Saving..." : "Save Password"}
                    </button>

                    <button
                      onClick={() => {
                        setShowSetPassword(false);
                        setPassword("");
                        setConfirmPassword("");
                      }}
                      className="bg-gray-600 px-3 py-2 rounded"
                    >
                      Cancel
                    </button>
                  </div>

                </div>
              )}
            </div>
          )}

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
