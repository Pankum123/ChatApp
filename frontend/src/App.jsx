import React from "react";
import Left from "./features/chat/components/Left";
import Right from "./features/chat/components/Right";
import Signup from "./features/auth/components/Signup";
import Login from "./features/auth/components/Login";
import { useAuth } from "./features/auth/context/AuthProvider";
import { Toaster } from "react-hot-toast";

import { Navigate, Route, Routes } from "react-router-dom";
import CallWindow from "./features/calls/private/components/CallWindow";
import GroupCallWindow from "./features/calls/group/components/GroupCallWindow";
import Home from "./features/chat/components/Home";

function App() {
  const [authUser, setAuthUser] = useAuth();
  console.log(authUser);
  return (
    <>
      <Routes>

        {/* Home Page */}
        <Route
          path="/home"
          element={authUser ? <Navigate to="/" /> : <Home />}
        />
        <Route
          path="/"
          element={
            authUser ? (
              // <div className="flex h-screen">
              //   <Left />
              //   <Right />
              // </div>
              <div className="drawer lg:drawer-open">
                <input
                  id="my-drawer-2"
                  type="checkbox"
                  className="drawer-toggle"
                />
                <div className="drawer-content flex flex-col items-center justify-center">
                  <Right />
                </div>
                <div className="drawer-side">
                  <label
                    htmlFor="my-drawer-2"
                    aria-label="close sidebar"
                    className="drawer-overlay"
                  ></label>
                  <ul className="menu w-80 min-h-full bg-black text-base-content">
                    <Left />
                  </ul>
                </div>
              </div>
            ) : (
              <Navigate to={"/home"} />
            )
          }
        />

        {/* Redirect old routes */}
        <Route path="/login" element={<Navigate to="/home" />} />
        <Route path="/signup" element={<Navigate to="/home" />} />

        {/* Unknown route */}
        <Route path="*" element={<Navigate to="/home" />} />

      </Routes>
      {/* Global Calling Window */}
      {authUser && (
        <>
          <CallWindow />
          <GroupCallWindow />
        </>
      )}
      <Toaster />
    </>
  );
}

export default App;
