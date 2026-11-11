
import express from "express";
import { createGroup, getGroupMessages, getGroups, sendGroupMessage } from "./group.controller.js";
import secureRoute from "../../middleware/secureRoute.js";

const router = express.Router();

router.post("/create", secureRoute, createGroup);
router.get("/get", secureRoute, getGroups);
router.post("/send/:id", secureRoute, sendGroupMessage);
router.get("/messages/:id", secureRoute, getGroupMessages);

export default router;
