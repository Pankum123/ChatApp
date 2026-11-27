import React, { useState } from "react";
import Login from "../../auth/components/Login";
import Signup from "../../auth/components/Signup";

const features = [
  {
    icon: "💬",
    title: "Real-Time Messaging",
    description:
      "Enjoy instant private conversations with online status and message history.",
  },
  {
    icon: "👥",
    title: "Group Conversations",
    description:
      "Create groups, manage members, assign admins and chat together.",
  },
  {
    icon: "📞",
    title: "Audio & Video Calls",
    description:
      "Connect face-to-face with voice and video calling.",
  },
  {
    icon: "📎",
    title: "Media & File Sharing",
    description:
      "Share images, videos, documents and forward messages easily.",
  },
  {
    icon: "🔒",
    title: "Privacy & Security",
    description:
      "Secure authentication and protected access to your account.",
  },
];

function Home() {
  const [isSignup, setIsSignup] = useState(false);

  const authCard = (
    <div className="w-full max-w-md">
      <div className="text-center mb-5">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          {isSignup ? "Create Your Account" : "Welcome Back!"}
        </h2>

        <p className="text-slate-400 text-sm">
          {isSignup
            ? "Join ChatApp and start connecting."
            : "Sign in to continue your conversations."}
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-700/70 rounded-2xl p-5 sm:p-6 shadow-2xl">
        {isSignup ? (
          <Signup onSwitch={() => setIsSignup(false)} />
        ) : (
          <Login onSwitch={() => setIsSignup(true)} />
        )}
      </div>

      <p className="text-center text-xs text-slate-500 mt-4">
        Your conversations. Your connections. Your ChatApp.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen md:h-screen w-full bg-slate-950 overflow-x-hidden md:overflow-hidden">
      <div className="min-h-screen md:h-screen flex flex-col md:flex-row">
        {/* LEFT SIDE */}
        <section className="w-full md:w-1/2 md:h-screen md:overflow-y-auto md:overflow-x-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 text-white px-5 sm:px-8 md:px-10 py-6 md:py-8 flex flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-7 md:mb-12 shrink-0">
            <div className="w-11 h-11 rounded-xl bg-blue-500 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/30">
              💬
            </div>

            <h2 className="text-xl font-bold tracking-wide">
              Chat<span className="text-green-400">App</span>
            </h2>
          </div>

          {/* Heading */}
          <div className="mb-7 md:mb-10 shrink-0">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
              Stay Connected.
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-blue-300">
                Anytime, Anywhere.
              </span>
            </h1>
          </div>

          {/* MOBILE LOGIN */}
          <div className="md:hidden flex justify-center mb-10">
            {authCard}
          </div>

          {/* Features */}
          <div className="flex flex-col gap-3">
            <h3 className="text-base font-bold mb-1">
              Explore Our Features
            </h3>

            {features.map((feature) => (
              <div
                key={feature.title}
                className="group flex items-center gap-4 p-3 sm:p-4 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md transition-all duration-300 hover:bg-white/15 hover:border-blue-300/40"
              >
                <div className="shrink-0 w-11 h-11 rounded-xl bg-blue-400/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>

                <div className="min-w-0">
                  <h4 className="font-bold text-sm sm:text-base">
                    {feature.title}
                  </h4>

                  <p className="text-xs sm:text-sm text-blue-100/80 mt-1 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-white/15 flex justify-between gap-2 text-xs text-blue-200">
            <p>Made for meaningful connections ❤️</p>
            <p>© {new Date().getFullYear()} ChatApp</p>
          </div>
        </section>

        {/* DESKTOP LOGIN */}
        <section className="hidden md:flex md:w-1/2 md:h-screen md:shrink-0 bg-slate-950 justify-center items-center p-8">
          {authCard}
        </section>
      </div>
    </div>
  );
}

export default Home;