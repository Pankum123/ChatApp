
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    // Email and password login enabled or disabled
    passwordLoginEnabled: {
      type: Boolean,
      default: true,
    },

    // User Profile Photo
    profilePic: {
      url: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      },
    },

    // User About / Message
    about: {
      type: String,
      default: "Hey there! I am using ChatApp.",
      maxlength: 100,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;
