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
exports.allMessages = exports.sendMessage = void 0;
const message_model_1 = __importDefault(require("../models/message.model"));
const chat_model_1 = __importDefault(require("../models/chat.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const sendMessage = (senderId, content, chatId) => __awaiter(void 0, void 0, void 0, function* () {
    let newMessage = yield message_model_1.default.create({
        sender: senderId,
        content,
        chat: chatId,
    });
    newMessage = yield newMessage.populate("sender", "name profilePic");
    newMessage = yield newMessage.populate("chat");
    newMessage = yield user_model_1.default.populate(newMessage, {
        path: "chat.users",
        select: "name profilePic email",
    });
    yield chat_model_1.default.findByIdAndUpdate(chatId, { latestMessage: newMessage });
    return newMessage;
});
exports.sendMessage = sendMessage;
const allMessages = (chatId) => __awaiter(void 0, void 0, void 0, function* () {
    const messages = yield message_model_1.default.find({ chat: chatId })
        .populate("sender", "name profilePic email")
        .populate("chat");
    return messages;
});
exports.allMessages = allMessages;
//# sourceMappingURL=message.repositories.js.map