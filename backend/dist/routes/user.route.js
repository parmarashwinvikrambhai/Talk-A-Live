"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.post("/register", user_controller_1.createUser);
router.post("/login", user_controller_1.loginUser);
router.post("/logout", user_controller_1.logoutUser);
router.get("/profile", auth_middleware_1.isAuthorizedUser, user_controller_1.getProfile);
router.get("/", auth_middleware_1.isAuthorizedUser, user_controller_1.searchUsers);
router.put("/profile/pic", auth_middleware_1.isAuthorizedUser, user_controller_1.updateProfilePic);
exports.default = router;
//# sourceMappingURL=user.route.js.map