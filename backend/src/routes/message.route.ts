import express from "express";
import { isAuthorizedUser } from "../middleware/auth.middleware";
import { allMessages, sendMessage } from "../controllers/message.controller";

const router = express.Router();

router.post("/",isAuthorizedUser, sendMessage);
router.get("/:chatId",isAuthorizedUser, allMessages);


export default router;
