import React from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthProvider";
import toast from "react-hot-toast";
import { loginUser } from "../../../shared/api";
import GoogleLogin from "./GoogleLogin";

function Login({ onSwitch }) {
  const [, setAuthUser] = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      const response = await loginUser({
        email: data.email,
        password: data.password,
      });

      if (response.data) {
        toast.success("Login successful");
      }

      localStorage.setItem("ChatApp", JSON.stringify(response.data));
      setAuthUser(response.data);
    } catch (error) {
      if (error.response) {
        toast.error("Error: " + error.response.data.error);
      } else {
        toast.error("Something went wrong!");
      }
    }
  };

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="box-border w-full max-w-sm mx-auto space-y-3 rounded-md border border-white bg-amber-100 px-5 sm:px-6 py-4"
      >
        <h1 className="text-2xl text-center text-black">
          Chat<span className="text-green-500 font-semibold">App</span>
        </h1>

        <h2 className="text-xl text-black font-bold">Login</h2>

        {/* Email */}
        <label className="input input-bordered flex items-center gap-2 !bg-gray-100 !text-gray-900">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="w-4 h-4 opacity-70"
          >
            <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
            <path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
          </svg>

          <input
            type="email"
            autoComplete="email"
            className="grow min-w-0 !bg-gray-100 !text-gray-900 placeholder:!text-gray-500"
            placeholder="Email"
            {...register("email", { required: true })}
          />
        </label>

        {errors.email && (
          <span className="text-red-500 text-sm font-semibold">
            This field is required
          </span>
        )}

        {/* Password */}
        <label className="input input-bordered flex items-center gap-2 !bg-gray-100 !text-gray-900">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="w-4 h-4 opacity-70"
          >
            <path
              fillRule="evenodd"
              d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
              clipRule="evenodd"
            />
          </svg>

          <input
            type="password"
            autoComplete="current-password"
            className="grow min-w-0 !bg-gray-100 !text-gray-900 placeholder:!text-gray-500"
            placeholder="Password"
            {...register("password", { required: true })}
          />
        </label>

        {errors.password && (
          <span className="text-red-500 text-sm font-semibold">
            This field is required
          </span>
        )}

        {/* Text & Button */}
        <div className="flex items-center justify-between gap-3 text-black">
          <p className="text-sm">
            New user?
            <button
              type="button"
              onClick={onSwitch}
              className="text-blue-500 underline cursor-pointer ml-1"
            >
              Signup
            </button>
          </p>

          <input
            type="submit"
            value="Login"
            className="text-white bg-green-500 px-3 py-1 cursor-pointer rounded-lg"
          />
        </div>

        <GoogleLogin />
      </form>
    </div>
  );
}

export default Login;
