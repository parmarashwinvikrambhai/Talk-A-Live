import express from "express";
import { isAuthorizedUser } from "../middleware/auth.middleware";
import {
  allMessages,
  sendMessage,
  deleteMessage,
} from "../controllers/message.controller";

const router = express.Router();

router.post("/", isAuthorizedUser, sendMessage);
router.get("/:chatId", isAuthorizedUser, allMessages);
router.delete("/:messageId", isAuthorizedUser, deleteMessage);

export default router;
