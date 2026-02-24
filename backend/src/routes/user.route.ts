import express from "express";
import {
  createUser,
  loginUser,
  logoutUser,
  getProfile,
  searchUsers,
  updateProfilePic,
} from "../controllers/user.controller";
import { isAuthorizedUser } from "../middleware/auth.middleware";
const router = express.Router();

router.post("/register", createUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/profile", isAuthorizedUser, getProfile);
router.get("/", isAuthorizedUser, searchUsers);
router.put("/profile/pic", isAuthorizedUser, updateProfilePic);

export default router;
