"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGroupChat = exports.fetchChats = exports.accessChat = void 0;
const chat_repositories_1 = __importDefault(require("../repositories/chat.repositories"));
const accessChat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { userId } = req.body;
    if (!userId) {
        return res
            .status(400)
            .json({ message: "UserId param not sent with request" });
    }
    try {
        const chat = yield chat_repositories_1.default.accessChat(userId, (_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        res.status(200).send(chat);
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.accessChat = accessChat;
const fetchChats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const chats = yield chat_repositories_1.default.fetchChats((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        res.status(200).send(chats);
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.fetchChats = fetchChats;
const createGroupChat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!req.body.users || !req.body.name) {
        return res.status(400).send({ message: "Please Fill all the feilds" });
    }
    let users = JSON.parse(req.body.users);
    if (users.length < 2) {
        return res
            .status(400)
            .send("More than 2 users are required to form a group chat");
    }
    users.push(req.user);
    try {
        const groupChat = yield chat_repositories_1.default.createGroupChat(users, req.body.name, (_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        res.status(200).json(groupChat);
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.createGroupChat = createGroupChat;
//# sourceMappingURL=chat.controller.js.map