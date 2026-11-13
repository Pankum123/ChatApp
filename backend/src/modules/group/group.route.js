
import express from "express";
import { addGroupMember, createGroup, deleteGroup, getGroupMessages, getGroups, leaveGroup, removeGroupMember, sendGroupMessage } from "./group.controller.js";
import secureRoute from "../../middleware/secureRoute.js";

const router = express.Router();

router.post("/create", secureRoute, createGroup);
router.get("/get", secureRoute, getGroups);
router.post("/send/:id", secureRoute, sendGroupMessage);
router.get("/messages/:id", secureRoute, getGroupMessages);
router.post("/add-member/:id", secureRoute, addGroupMember);
router.post("/remove-member/:id", secureRoute, removeGroupMember);
router.delete("/delete/:id", secureRoute, deleteGroup);
router.post("/leave/:id", secureRoute, leaveGroup);

export default router;
