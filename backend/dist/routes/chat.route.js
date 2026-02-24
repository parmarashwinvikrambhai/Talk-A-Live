"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const chat_controller_1 = require("../controllers/chat.controller");
const router = express_1.default.Router();
router.post("/", auth_middleware_1.isAuthorizedUser, chat_controller_1.accessChat);
router.get("/", auth_middleware_1.isAuthorizedUser, chat_controller_1.fetchChats);
router.post("/group", auth_middleware_1.isAuthorizedUser, chat_controller_1.createGroupChat);
exports.default = router;
//# sourceMappingURL=chat.route.js.map