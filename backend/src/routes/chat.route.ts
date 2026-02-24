import express from "express";
import { isAuthorizedUser } from "../middleware/auth.middleware";
import {
  accessChat,
  fetchChats,
  createGroupChat,
} from "../controllers/chat.controller";

const router = express.Router();

router.post("/",isAuthorizedUser, accessChat);
router.get("/",isAuthorizedUser, fetchChats);
router.post("/group",isAuthorizedUser, createGroupChat);


export default router;
