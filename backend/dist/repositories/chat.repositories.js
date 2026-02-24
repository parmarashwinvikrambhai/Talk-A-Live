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
const chat_model_1 = __importDefault(require("../models/chat.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const accessChat = (userId, currentUserId) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if a 1-on-1 chat exists between the two users
    let isChat = yield chat_model_1.default.find({
        isGroupChat: false,
        $and: [
            { users: { $elemMatch: { $eq: currentUserId } } },
            { users: { $elemMatch: { $eq: userId } } },
        ],
    })
        .populate("users", "-password")
        .populate("latestMessage");
    isChat = yield user_model_1.default.populate(isChat, {
        path: "latestMessage.sender",
        select: "name profilePic email",
    });
    if (isChat.length > 0) {
        return isChat[0];
    }
    else {
        const chatData = {
            chatName: "sender",
            isGroupChat: false,
            users: [currentUserId, userId],
        };
        const createdChat = yield chat_model_1.default.create(chatData);
        const fullChat = yield chat_model_1.default.findOne({ _id: createdChat._id }).populate("users", "-password");
        return fullChat;
    }
});
const fetchChats = (currentUserId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let results = yield chat_model_1.default.find({
            users: { $elemMatch: { $eq: currentUserId } },
        })
            .populate("users", "-password")
            .populate("groupAdmin", "-password")
            .populate("latestMessage")
            .sort({ updatedAt: -1 });
        results = yield user_model_1.default.populate(results, {
            path: "latestMessage.sender",
            select: "name profilePic email",
        });
        return results;
    }
    catch (error) {
        throw error;
    }
});
const createGroupChat = (users, name, adminId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const groupChat = yield chat_model_1.default.create({
            chatName: name,
            users: users,
            isGroupChat: true,
            groupAdmin: adminId,
        });
        const fullGroupChat = yield chat_model_1.default.findOne({ _id: groupChat._id })
            .populate("users", "-password")
            .populate("groupAdmin", "-password");
        return fullGroupChat;
    }
    catch (error) {
        throw error;
    }
});
exports.default = {
    accessChat,
    fetchChats,
    createGroupChat,
};
//# sourceMappingURL=chat.repositories.js.map