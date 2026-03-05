"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMessage = exports.allMessages = exports.sendMessage = void 0;
const messageRepositories = __importStar(require("../repositories/message.repositories"));
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { content, chatId, isAudio, duration } = req.body;
    // Use a more robust check for boolean isAudio
    const isAudioMessage = isAudio === true || isAudio === "true";
    console.log("=== BACKEND SEND_MESSAGE START ===");
    console.log("Full req.body:", {
        chatId,
        contentLength: content ? content.length : 0,
        isAudio: isAudio,
        isAudioType: typeof isAudio,
        isAudioMessageResult: isAudioMessage,
        duration,
    });
    if (!chatId || (!content && !isAudioMessage)) {
        console.log("Validation failed: missing chatId or (content and isAudioMessage)");
        return res.sendStatus(400);
    }
    try {
        const message = yield messageRepositories.sendMessage((_a = req.user) === null || _a === void 0 ? void 0 : _a.id, content, chatId, isAudioMessage, duration);
        console.log("Message successfully created and returning to client");
        res.json(message);
    }
    catch (error) {
        console.error("Error in sendMessage controller:", error.message);
        res.status(400).json({ message: error.message });
    }
    console.log("=== BACKEND SEND_MESSAGE END ===");
});
exports.sendMessage = sendMessage;
const allMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const messages = yield messageRepositories.allMessages(req.params.chatId, (_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        res.json(messages);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.allMessages = allMessages;
const deleteMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const messageId = req.params.messageId;
        const requesterId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!requesterId) {
            return res
                .status(401)
                .json({ message: "User identity missing from token" });
        }
        const deletedMessage = yield messageRepositories.deleteMessage(messageId, requesterId);
        if (!deletedMessage) {
            console.log("CONTROLLER DELETE ERROR: Repository returned null");
            return res.status(404).json({ message: "Message not found" });
        }
        // Emit real-time event to all users in the chat
        const io = req.app.get("io");
        const chat = deletedMessage.chat;
        if (io && (chat === null || chat === void 0 ? void 0 : chat.users)) {
            chat.users.forEach((user) => {
                const targetId = (user._id || user.id || user).toString();
                io.to(targetId).emit("message deleted", deletedMessage);
            });
        }
        res.json(deletedMessage);
    }
    catch (error) {
        console.error("CONTROLLER DELETE CRITICAL ERROR:", error.message);
        res
            .status(((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes("only delete your own")) ? 403 : 400)
            .json({ message: error.message });
    }
});
exports.deleteMessage = deleteMessage;
//# sourceMappingURL=message.controller.js.map