
import express from "express";
import { googleLogin } from "./googleAuth.controller.js";

const router = express.Router();

// Google Sign-In
router.post("/login", googleLogin);

export default router;
