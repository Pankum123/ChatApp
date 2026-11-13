import User from "./user.model.js";
import bcrypt from "bcryptjs";
import createTokenAndSaveCookie from "../../jwt/generateToken.js";
import { v2 as cloudinary } from "cloudinary";

export const signup = async (req, res) => {
  const { fullname, email, password, confirmPassword } = req.body;
  try {
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: "User already registered" });
    }
    // Hashing the password
    const hashPassword = await bcrypt.hash(password, 10);
    const newUser = await new User({
      fullname,
      email,
      password: hashPassword,
    });
    await newUser.save();
    if (newUser) {
      createTokenAndSaveCookie(newUser._id, res);
      res.status(201).json({
        message: "User created successfully",
        user: {
          _id: newUser._id,
          fullname: newUser.fullname,
          email: newUser.email,
        },
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!user || !isMatch) {
      return res.status(400).json({ error: "Invalid user credential" });
    }
    createTokenAndSaveCookie(user._id, res);
    res.status(201).json({
      message: "User logged in successfully",
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const logout = async (req, res) => {
  try {
    res.clearCookie("jwt");
    res.status(201).json({ message: "User logged out successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const allUsers = async (req, res) => {
  try {
    const loggedInUser = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUser },
    }).select("-password");
    res.status(201).json(filteredUsers);
  } catch (error) {
    console.log("Error in allUsers Controller: " + error);
  }
};


// ===== Update User Profile Photo =====
export const updateProfilePic = async (req, res) => {
  const userId = req.user._id;

  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({
        errors: "No file uploaded",
      });
    }

    const { image } = req.files;

    const allowedFormat = ["image/png", "image/jpeg"];

    if (!allowedFormat.includes(image.mimetype)) {
      return res.status(400).json({
        errors: "Invalid file format. Only PNG and JPG are allowed",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        errors: "User not found",
      });
    }

    // Cloudinary upload
    const cloud_response = await cloudinary.uploader.upload(
      image.tempFilePath
    );

    if (!cloud_response || !cloud_response.public_id) {
      return res.status(400).json({
        errors: "Error uploading file to cloudinary",
      });
    }

    const oldPublicId = user.profilePic?.publicId;

    user.profilePic = {
      publicId: cloud_response.public_id,
      url: cloud_response.url,
    };

    await user.save();

    // Delete old profile photo
    if (oldPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId);
      } catch (error) {
        console.log("Old profile image delete error:", error);
      }
    }

    const updatedUser = await User.findById(userId).select("-password");

    return res.status(200).json({
      message: "Profile photo updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.log("Profile Photo Update Error:", error);

    return res.status(500).json({
      errors: "Error updating profile photo",
    });
  }
};

// ===== Update User Full Name =====
export const updateFullname = async (req, res) => {
  const userId = req.user._id;
  const { fullname } = req.body;

  try {
    if (!fullname || !fullname.trim()) {
      return res.status(400).json({
        errors: "Name is required",
      });
    }

    if (fullname.trim().length > 50) {
      return res.status(400).json({
        errors: "Name cannot exceed 50 characters",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { fullname: fullname.trim() },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        errors: "User not found",
      });
    }

    return res.status(200).json({
      message: "Name updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.log("Name Update Error:", error);

    return res.status(500).json({
      errors: "Error updating name",
    });
  }
};

// ===== Update User About =====
export const updateAbout = async (req, res) => {
  const userId = req.user._id;
  const { about } = req.body;

  try {
    if (typeof about !== "string") {
      return res.status(400).json({
        errors: "About must be text",
      });
    }

    if (about.trim().length > 100) {
      return res.status(400).json({
        errors: "About cannot exceed 100 characters",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { about: about.trim() },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        errors: "User not found",
      });
    }

    return res.status(200).json({
      message: "About updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.log("About Update Error:", error);

    return res.status(500).json({
      errors: "Error updating about",
    });
  }
};
