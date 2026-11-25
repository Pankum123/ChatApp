import React from "react";
import Left from "./features/chat/components/Left";
import Right from "./features/chat/components/Right";
import { useAuth } from "./features/auth/context/AuthProvider";
import { Toaster } from "react-hot-toast";

import { Navigate, Route, Routes } from "react-router-dom";
import CallWindow from "./features/calls/private/components/CallWindow";
import GroupCallWindow from "./features/calls/group/components/GroupCallWindow";
import Home from "./features/chat/components/Home";

function App() {
  const [authUser] = useAuth();

  return (
    <>
      <Routes>
        {/* Home Page */}
        <Route
          path="/home"
          element={authUser ? <Navigate to="/" /> : <Home />}
        />

        {/* Chat Page */}
        <Route
          path="/"
          element={
            authUser ? (
              <div className="drawer lg:drawer-open h-dvh min-h-0 overflow-hidden">
                <input
                  id="my-drawer-2"
                  type="checkbox"
                  className="drawer-toggle"
                />

                {/* Main Chat Area */}
                <div className="drawer-content h-dvh min-h-0 overflow-hidden flex flex-col">
                  <Right />
                </div>

                {/* Sidebar */}
                <div className="drawer-side h-dvh min-h-0 overflow-hidden">
                  <label
                    htmlFor="my-drawer-2"
                    aria-label="close sidebar"
                    className="drawer-overlay"
                  ></label>

                  <ul className="menu w-80 h-dvh min-h-0 flex flex-col flex-nowrap overflow-hidden p-0 bg-black text-base-content">
                    <Left />
                  </ul>
                </div>
              </div>
            ) : (
              <Navigate to="/home" />
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
