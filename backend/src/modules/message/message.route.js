import express from "express";
import { deleteMessageForEveryone, deleteMessageForMe, getMessage, sendMessage } from "./message.controller.js";
import secureRoute from "../../middleware/secureRoute.js";

const router = express.Router();
router.post("/send/:id", secureRoute, sendMessage);
router.get("/get/:id", secureRoute, getMessage);
router.delete("/delete-for-me/:id", secureRoute, deleteMessageForMe);
router.delete("/delete-for-everyone/:id", secureRoute, deleteMessageForEveryone);

export default router;
