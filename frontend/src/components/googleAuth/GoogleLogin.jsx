
import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../utils/googleFirebase";
import { googleLoginAPI } from "../../api";
import { useAuth } from "../../context/AuthProvider";
import toast from "react-hot-toast";

function GoogleLogin() {
  const [authUser, setAuthUser] = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      // Open Google Sign-In popup
      const result = await signInWithPopup(auth, googleProvider);

      // Get Firebase ID token
      const idToken = await result.user.getIdToken();

      // Send token to ChatApp backend
      const response = await googleLoginAPI(idToken);

      // Save user data
      localStorage.setItem(
        "ChatApp",
        JSON.stringify(response.data)
      );

      setAuthUser(response.data);

      toast.success("Google login successful!");

    } catch (error) {
      console.error("Google Login Error:", error);

      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Google login failed";

      toast.error(message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3
      border border-gray-300 bg-white text-gray-700
      font-semibold py-2 px-4 rounded-lg
      hover:bg-gray-100 transition disabled:opacity-50"
    >
      <img
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
        alt="Google"
        className="w-5 h-5"
      />

      {loading ? "Please wait..." : "Continue with Google"}
    </button>
  );
}

export default GoogleLogin;
