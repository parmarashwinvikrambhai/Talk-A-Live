import express from "express";
import { isAuthorizedUser } from "../middleware/auth.middleware";
import {
  accessChat,
  fetchChats,
  createGroupChat,
  addToGroup,
  removeFromGroup,
} from "../controllers/chat.controller";

const router = express.Router();

router.post("/", isAuthorizedUser, accessChat);
router.get("/", isAuthorizedUser, fetchChats);
router.post("/group", isAuthorizedUser, createGroupChat);
router.put("/group/add", isAuthorizedUser, addToGroup);
router.put("/group/remove", isAuthorizedUser, removeFromGroup);

export default router;
