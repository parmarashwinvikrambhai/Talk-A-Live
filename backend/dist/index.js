"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./config/db"));
const user_route_1 = __importDefault(require("./routes/user.route"));
const chat_route_1 = __importDefault(require("./routes/chat.route"));
const message_route_1 = __importDefault(require("./routes/message.route"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
dotenv_1.default.config();
(0, db_1.default)();
const app = (0, express_1.default)();
const allowedOrigins = [
    process.env.FRONTEND_URL,
    "http://localhost:5173",
].filter(Boolean);
console.log("Allowed Origins for CORS (DEBUG):", allowedOrigins);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));
app.use(express_1.default.json({ limit: "50mb" }));
app.use(express_1.default.urlencoded({ limit: "50mb", extended: true }));
app.use((0, cookie_parser_1.default)());
app.use("/api/v1/auth", user_route_1.default);
app.use("/api/v1/chat", chat_route_1.default);
app.use("/api/v1/message", message_route_1.default);
const PORT = process.env.PORT || 2000;
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    pingTimeout: 60000,
    maxHttpBufferSize: 1e8, // 100MB
    cors: {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            }
            else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    },
});
app.set("io", io);
console.log("SERVER: Socket handler initialized at", new Date().toLocaleTimeString());
// --- SOCKET HANDSHAKE AUTH MIDDLEWARE ---
io.use((socket, next) => {
    var _a;
    const token = (_a = socket.handshake.auth) === null || _a === void 0 ? void 0 : _a.token;
    if (!token) {
        console.log("SOCKET AUTH ERROR: No token provided");
        return next(new Error("Authentication error: Token missing"));
    }
    try {
        const secret = process.env.JWT_SECRET || "";
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        socket.user = decoded;
        console.log("SOCKET AUTH SUCCESS: User:", decoded.name, `(${decoded.id})`);
        next();
    }
    catch (err) {
        console.log("SOCKET AUTH ERROR: Invalid token");
        next(new Error("Authentication error: Invalid token"));
    }
});
io.on("connection", (socket) => {
    var _a, _b;
    console.log("SOCKET: New connection - ID:", socket.id, "User:", (_a = socket.user) === null || _a === void 0 ? void 0 : _a.name, "at", new Date().toLocaleTimeString());
    // Automatically join user to their private room upon authenticated connection
    if ((_b = socket.user) === null || _b === void 0 ? void 0 : _b.id) {
        const userId = socket.user.id.toString();
        socket.join(userId);
        console.log("SOCKET: User automatically joined setup room:", userId);
    }
    socket.on("setup", (userData) => {
        var _a;
        // Keep for legacy reasons if frontend still emits it,
        // but the main joining logic is now in the handshake middleware.
        const userId = (_a = ((userData === null || userData === void 0 ? void 0 : userData._id) || (userData === null || userData === void 0 ? void 0 : userData.id))) === null || _a === void 0 ? void 0 : _a.toString();
        if (userId) {
            socket.join(userId);
            console.log("SOCKET: User joined setup room (via setup event):", userId);
            socket.emit("connected");
        }
    });
    socket.on("join chat", (room) => {
        const roomId = room === null || room === void 0 ? void 0 : room.toString();
        if (roomId) {
            socket.join(roomId);
            console.log("User Joined Chat Room:", roomId);
        }
    });
    socket.on("typing", (room) => socket.in(room).emit("typing"));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));
    socket.on("new message", (newMessageRecieved) => {
        var _a, _b;
        const chat = newMessageRecieved.chat;
        console.log("=== NEW MESSAGE EVENT ===");
        console.log("Chat ID:", (chat === null || chat === void 0 ? void 0 : chat._id) || chat);
        if (!chat)
            return console.log("ERROR: chat is undefined");
        if (!chat.users)
            return console.log("ERROR: chat.users not defined");
        console.log("Chat ID:", chat._id);
        console.log("Number of users in chat:", chat.users.length);
        console.log("Sender:", ((_a = newMessageRecieved.sender) === null || _a === void 0 ? void 0 : _a._id) || ((_b = newMessageRecieved.sender) === null || _b === void 0 ? void 0 : _b.id));
        chat.users.forEach((user) => {
            var _a, _b;
            const targetId = (_a = (user._id || user.id)) === null || _a === void 0 ? void 0 : _a.toString();
            if (newMessageRecieved.sender) {
                const senderId = (_b = (newMessageRecieved.sender._id || newMessageRecieved.sender.id)) === null || _b === void 0 ? void 0 : _b.toString();
                if (targetId === senderId)
                    return;
            }
            console.log(`Sending message to target user: ${targetId}`);
            io.to(targetId).emit("message recieved", newMessageRecieved);
        });
        console.log("=== END NEW MESSAGE ===");
    });
    socket.on("disconnect", () => {
        console.log("USER DISCONNECTED");
    });
});
server.listen(PORT, () => {
    console.log(`server Running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map