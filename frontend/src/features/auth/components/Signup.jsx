import React from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthProvider";
import toast from "react-hot-toast";
import { signupUser } from "../../../shared/api";
import GoogleLogin from "./GoogleLogin";

function Signup({ onSwitch }) {
  const [, setAuthUser] = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch("password", "");

  const validatePasswordMatch = (value) => {
    return value === password || "Passwords do not match";
  };

  const onSubmit = async (data) => {
    try {
      const response = await signupUser({
        fullname: data.fullname,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      if (response.data) {
        toast.success("Signup successful");
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

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 [color-scheme:light]";

  return (
    <div className="w-full px-3 py-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto w-full max-w-xs space-y-3 rounded-xl border border-gray-100 bg-white p-5 shadow-lg shadow-gray-200/50 [color-scheme:light]"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Chat<span className="text-green-500">App</span>
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            Create your account.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">
            Full name
          </label>
          <input
            type="text"
            autoComplete="name"
            placeholder="Enter full name"
            className={inputClass}
            {...register("fullname", { required: true })}
          />
          {errors.fullname && (
            <p className="mt-1 text-xs text-red-500">
              Full name is required
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">
            Email
          </label>
          <input
            type="email"
            autoComplete="email"
            placeholder="Enter email"
            className={inputClass}
            {...register("email", { required: true })}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">
              Email is required
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">
            Password
          </label>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Create password"
            className={inputClass}
            {...register("password", { required: true })}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">
              Password is required
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">
            Confirm password
          </label>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Confirm password"
            className={inputClass}
            {...register("confirmPassword", {
              required: true,
              validate: validatePasswordMatch,
            })}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500">
              {errors.confirmPassword.message ||
                "Confirm password is required"}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-green-500 py-2.5 text-sm font-semibold text-white transition hover:bg-green-600 active:scale-[0.98]"
        >
          Signup
        </button>

        <p className="text-center text-xs text-gray-500">
          Already have an account?
          <button
            type="button"
            onClick={onSwitch}
            className="ml-1 font-semibold text-green-600 hover:underline"
          >
            Login
          </button>
        </p>

        <GoogleLogin />
      </form>
    </div>
  );
}

export default Signup;
