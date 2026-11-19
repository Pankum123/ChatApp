
import User from "../user/user.model.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { firebaseAdminAuth } from "../../config/firebaseAdmin.js";
import createTokenAndSaveCookie from "../../jwt/generateToken.js";

export const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    // Check ID Token
    if (!idToken) {
      return res.status(400).json({
        error: "Google ID token is required",
      });
    }

    // Verify Firebase ID Token
    let decodedToken;

    try {
      decodedToken = await firebaseAdminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error("Firebase Token Error:", error);

      return res.status(401).json({
        error: "Invalid or expired Google token",
      });
    }

    // Get user information
    const {
      uid,
      email,
      name,
      picture,
      email_verified,
    } = decodedToken;

    // Check verified email
    if (!email || !email_verified) {
      return res.status(401).json({
        error: "Google email is not verified",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find existing ChatApp user
    let user = await User.findOne({
      email: normalizedEmail,
    });

    // Create new user if not registered
    if (!user) {
      const randomPassword = crypto
        .randomBytes(32)
        .toString("hex");

      const hashedPassword = await bcrypt.hash(
        randomPassword,
        10
      );

      try {
        user = await User.create({
          fullname: name || normalizedEmail.split("@")[0],

          email: normalizedEmail,

          password: hashedPassword,

          // Google user cannot use password login initially
          passwordLoginEnabled: false,

          profilePic: {
            url: picture || "",
            publicId: "",
          },
        });

      } catch (error) {
        // Handle simultaneous account creation
        if (error.code === 11000) {
          user = await User.findOne({
            email: normalizedEmail,
          });
        } else {
          throw error;
        }
      }
    }

    if (!user) {
      return res.status(500).json({
        error: "Unable to create or find user",
      });
    }

    // Generate ChatApp JWT Cookie
    createTokenAndSaveCookie(user._id, res);

    return res.status(200).json({
      message: "Google login successful",

      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        profilePic: user.profilePic,
        about: user.about,
        passwordLoginEnabled: user.passwordLoginEnabled,
      },
    });

  } catch (error) {
    console.error("Google Login Error:", error);

    return res.status(500).json({
      error: "Google authentication failed",
    });
  }
};
