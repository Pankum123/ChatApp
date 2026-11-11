
import express from "express";
import { createGroup, getGroups } from "./group.controller.js";
import secureRoute from "../../middleware/secureRoute.js";

const router = express.Router();

router.post("/create", secureRoute, createGroup);
router.get("/get", secureRoute, getGroups);

export default router;
