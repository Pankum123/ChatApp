
import express from "express";
import { addGroupMember, createGroup, getGroupMessages, getGroups, removeGroupMember, sendGroupMessage } from "./group.controller.js";
import secureRoute from "../../middleware/secureRoute.js";

const router = express.Router();

router.post("/create", secureRoute, createGroup);
router.get("/get", secureRoute, getGroups);
router.post("/send/:id", secureRoute, sendGroupMessage);
router.get("/messages/:id", secureRoute, getGroupMessages);
router.post("/add-member/:id", secureRoute, addGroupMember);
router.post("/remove-member/:id", secureRoute, removeGroupMember);

export default router;
