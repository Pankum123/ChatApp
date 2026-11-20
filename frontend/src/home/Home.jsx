
import React, { useState } from "react";
import Login from "../features/auth/components/Login";
import Signup from "../features/auth/components/Signup";

function Home() {
  const [isSignup, setIsSignup] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-blue-300">

      {/* LEFT SIDE - APP INTRO */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-950 to-blue-700 text-white flex flex-col justify-center items-center px-8 py-12 md:px-16">

        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
          Welcome to Chat
          <span className="text-green-400">App</span>
        </h1>

        <p className="text-lg text-blue-100 text-center mb-10">
          Connect with people. Share your moments.
          Make every conversation meaningful.
        </p>

        <div className="space-y-6 w-full max-w-md">

          <div className="flex items-center gap-4">
            <span className="text-4xl">💬</span>
            <div>
              <h3 className="font-semibold text-lg">
                Real-Time Messaging
              </h3>
              <p className="text-blue-200 text-sm">
                Chat with your friends instantly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-4xl">📞</span>
            <div>
              <h3 className="font-semibold text-lg">
                Audio & Video Calls
              </h3>
              <p className="text-blue-200 text-sm">
                Connect through voice and video calls.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-4xl">👥</span>
            <div>
              <h3 className="font-semibold text-lg">
                Stay Connected
              </h3>
              <p className="text-blue-200 text-sm">
                Enjoy conversations with your people.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-4xl">🔒</span>
            <div>
              <h3 className="font-semibold text-lg">
                Secure Login
              </h3>
              <p className="text-blue-200 text-sm">
                Sign in with Email or Google.
              </p>
            </div>
          </div>

        </div>

        <p className="mt-12 text-blue-200 text-sm text-center">
          Your conversations, your connections, your ChatApp.
        </p>

      </div>

      {/* RIGHT SIDE - LOGIN / SIGNUP */}
      <div className="w-full md:w-1/2 flex justify-center items-center p-4 md:p-8">

        <div className="w-full max-w-md">

          {isSignup ? (
            <Signup onSwitch={() => setIsSignup(false)} />
          ) : (
            <Login onSwitch={() => setIsSignup(true)} />
          )}

        </div>

      </div>

    </div>
  );
}

export default Home;
