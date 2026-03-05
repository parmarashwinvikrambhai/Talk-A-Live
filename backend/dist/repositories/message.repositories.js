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
exports.deleteMessage = exports.allMessages = exports.sendMessage = void 0;
const message_model_1 = __importDefault(require("../models/message.model"));
const chat_model_1 = __importDefault(require("../models/chat.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const sendMessage = (senderId_1, content_1, chatId_1, ...args_1) => __awaiter(void 0, [senderId_1, content_1, chatId_1, ...args_1], void 0, function* (senderId, content, chatId, isAudio = false, duration) {
    const chat = yield chat_model_1.default.findById(chatId);
    if (!chat)
        throw new Error("Chat not found");
    const isMember = chat.users.some((userId) => userId.toString() === senderId.toString());
    if (!isMember) {
        throw new Error("You are not a member of this chat");
    }
    console.log("REPOSITORY: Creating message Document with data:", {
        sender: senderId,
        chat: chatId,
        isAudio,
        duration,
        contentPreview: content ? content.substring(0, 30) + "..." : null,
    });
    let newMessage = yield message_model_1.default.create({
        sender: senderId,
        content,
        chat: chatId,
        isAudio,
        duration,
    });
    console.log("REPOSITORY: Message DOCUMENT CREATED in DB:", {
        _id: newMessage._id,
        isAudio: newMessage.isAudio,
        duration: newMessage.duration,
    });
    newMessage = yield newMessage.populate("sender", "name profilePic");
    newMessage = yield newMessage.populate("chat");
    newMessage = (yield user_model_1.default.populate(newMessage, {
        path: "chat.users",
        select: "name profilePic email",
    }));
    yield chat_model_1.default.findByIdAndUpdate(chatId, { latestMessage: newMessage });
    return newMessage;
});
exports.sendMessage = sendMessage;
const allMessages = (chatId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const chat = yield chat_model_1.default.findById(chatId);
    if (!chat)
        throw new Error("Chat not found");
    const clearedAt = (_a = chat.clearedHistory) === null || _a === void 0 ? void 0 : _a.get(userId);
    const filter = { chat: chatId };
    if (clearedAt) {
        filter.createdAt = { $gt: clearedAt };
    }
    const messages = yield message_model_1.default.find(filter)
        .populate("sender", "name profilePic email")
        .populate("chat");
    return messages;
});
exports.allMessages = allMessages;
const deleteMessage = (messageId, requesterId) => __awaiter(void 0, void 0, void 0, function* () {
    const message = yield message_model_1.default.findById(messageId).populate("chat");
    if (!message)
        throw new Error("Message not found");
    // Only the sender can delete
    const senderId = String(message.sender);
    const reqId = String(requesterId);
    if (senderId !== reqId) {
        console.log("DEBUG DELETE: AUTHORIZATION FAILED - mismatch between", senderId, "and", reqId);
        throw new Error("You can only delete your own messages");
    }
    // Soft delete: wipe content, set isDeleted flag
    message.content = "This message was deleted";
    message.isDeleted = true;
    yield message.save();
    // Re-populate for socket broadcast
    let populated = yield message_model_1.default.findById(messageId)
        .populate("sender", "name profilePic email")
        .populate("chat");
    if (!populated) {
        throw new Error("Message lost after update");
    }
    populated = (yield user_model_1.default.populate(populated, {
        path: "chat.users",
        select: "name profilePic email",
    }));
    return populated;
});
exports.deleteMessage = deleteMessage;
//# sourceMappingURL=message.repositories.js.map