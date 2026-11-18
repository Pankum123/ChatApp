
import User from "../user/user.model.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { firebaseAdminAuth } from "../../config/firebaseAdmin.js";
import createTokenAndSaveCookie from "../../jwt/generateToken.js";

export const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    // Check ID token
    if (!idToken) {
      return res.status(400).json({
        error: "Google ID token is required",
      });
    }

    // Verify Google token using Firebase Admin
    const decodedToken = await firebaseAdminAuth.verifyIdToken(idToken);

    const { email, name, picture, email_verified } = decodedToken;

    if (!email || !email_verified) {
      return res.status(401).json({
        error: "Google email is not verified",
      });
    }

    // Find existing ChatApp user
    let user = await User.findOne({ email });

    // Create new user if not registered
    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await User.create({
        fullname: name || email.split("@")[0],
        email,
        password: hashedPassword,
        profilePic: {
          url: picture || "",
          publicId: "",
        },
      });
    }

    // Generate existing ChatApp JWT cookie
    createTokenAndSaveCookie(user._id, res);

    return res.status(200).json({
      message: "Google login successful",
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        profilePic: user.profilePic,
        about: user.about,
      },
    });

  } catch (error) {
    console.error("Google Login Error:", error);

    return res.status(401).json({
      error: "Google authentication failed",
    });
  }
};
