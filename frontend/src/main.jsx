import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./context/AuthProvider.jsx";
import { BrowserRouter } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext.jsx";
import { CallProvider } from "./context/call/CallContext.jsx";
import { GroupCallProvider } from "./context/call/group/GroupCallContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <SocketProvider>
        <CallProvider>
          <GroupCallProvider>
            <App />
          </GroupCallProvider>
        </CallProvider>
      </SocketProvider>
    </AuthProvider>
  </BrowserRouter>
);
