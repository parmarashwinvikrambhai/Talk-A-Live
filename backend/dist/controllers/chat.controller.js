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
exports.clearChat = exports.removeFromGroup = exports.addToGroup = exports.createGroupChat = exports.fetchChats = exports.accessChat = void 0;
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
    var _a, _b;
    try {
        const { users: rawUsers, name } = req.body;
        if (!rawUsers || !name) {
            return res.status(400).json({ message: "Please fill all the fields" });
        }
        let users;
        try {
            users =
                typeof req.body.users === "string"
                    ? JSON.parse(req.body.users)
                    : req.body.users;
        }
        catch (e) {
            return res.status(400).json({ message: "Invalid users format" });
        }
        if (!Array.isArray(users)) {
            return res.status(400).json({ message: "Users must be an array" });
        }
        const adminId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id);
        if (!adminId) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        const adminIdStr = adminId.toString();
        if (!users.includes(adminIdStr)) {
            users.push(adminIdStr);
        }
        const groupChat = yield chat_repositories_1.default.createGroupChat(users, req.body.name, adminIdStr);
        res.status(200).json(groupChat);
    }
    catch (error) {
        console.error("CREATE GROUP CRITICAL ERROR:", error);
        res.status(500).json({
            message: "Database Error: " + (error.message || "Unknown error"),
            error: error.message || error,
        });
    }
});
exports.createGroupChat = createGroupChat;
const addToGroup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { chatId, userId } = req.body;
    if (!chatId || !userId) {
        return res.status(400).json({ message: "chatId and userId are required" });
    }
    try {
        const { updatedChat, systemMessage } = yield chat_repositories_1.default.addToGroup(chatId, userId);
        if (!updatedChat)
            return res.status(404).json({ message: "Chat not found" });
        if (systemMessage) {
            const io = req.app.get("io");
            const fullMessage = systemMessage.toObject();
            fullMessage.chat = updatedChat;
            console.log(`EMIT: Notifying members of join in chat ${chatId}`);
            updatedChat.users.forEach((user) => {
                const targetId = (user._id || user.id || user).toString();
                console.log(`EMIT: Sending to user ${targetId}`);
                io.to(targetId).emit("message recieved", fullMessage);
            });
        }
        res.status(200).json(updatedChat);
    }
    catch (error) {
        res.status(500).json({ message: error.message || "Server Error" });
    }
});
exports.addToGroup = addToGroup;
const removeFromGroup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { chatId, userId } = req.body;
    if (!chatId || !userId) {
        return res.status(400).json({ message: "chatId and userId are required" });
    }
    try {
        const { updatedChat, systemMessage } = yield chat_repositories_1.default.removeFromGroup(chatId, userId);
        if (!updatedChat)
            return res.status(404).json({ message: "Chat not found" });
        if (systemMessage) {
            const io = req.app.get("io");
            const fullMessage = systemMessage.toObject();
            fullMessage.chat = updatedChat; // Attach chat details for socket listeners
            console.log(`EMIT: Notifying members of leave in chat ${chatId}`);
            // Notify remaining members
            updatedChat.users.forEach((u) => {
                const targetId = (u._id || u.id || u).toString();
                console.log(`EMIT: Sending to remaining member ${targetId}`);
                io.to(targetId).emit("message recieved", fullMessage);
            });
            //Notify the user who was just removed/left!
            console.log(`EMIT: Sending to removed user ${userId}`);
            io.to(userId.toString()).emit("message recieved", fullMessage);
        }
        res.status(200).json(updatedChat);
    }
    catch (error) {
        res.status(500).json({ message: error.message || "Server Error" });
    }
});
exports.removeFromGroup = removeFromGroup;
const clearChat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { chatId } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!chatId || !userId) {
        return res
            .status(400)
            .json({ message: "chatId and authenticated userId are required" });
    }
    try {
        const updatedChat = yield chat_repositories_1.default.clearChat(chatId, userId.toString());
        res.status(200).json(updatedChat);
    }
    catch (error) {
        res.status(500).json({ message: error.message || "Server Error" });
    }
});
exports.clearChat = clearChat;
//# sourceMappingURL=chat.controller.js.map