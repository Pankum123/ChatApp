import express from "express";
import {
  allUsers,
  login,
  logout,
  signup,
  updateAbout,
  updateFullname,
  updateProfilePic,
} from "./user.controller.js";
import secureRoute from "../../middleware/secureRoute.js";
const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/allusers", secureRoute, allUsers);
router.put("/update-profile-pic", secureRoute, updateProfilePic);
router.put("/update-fullname", secureRoute, updateFullname);
router.put("/update-about", secureRoute, updateAbout);

export default router;
