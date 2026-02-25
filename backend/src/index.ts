import express from "express";
import dotenv from "dotenv";
import dbConnect from "./config/db";
import userRoute from "./routes/user.route";
import chatRoute from "./routes/chat.route";
import messageRoute from "./routes/message.route";
import cookieParser from "cookie-parser";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";

import jwt from "jsonwebtoken";

dotenv.config();
dbConnect();

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

app.use("/api/v1/auth", userRoute);
app.use("/api/v1/chat", chatRoute);
app.use("/api/v1/message", messageRoute);

const PORT = process.env.PORT || 2000;
const server = http.createServer(app);

const io = new Server(server, {
  pingTimeout: 60000,
  maxHttpBufferSize: 1e8, // 100MB
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});
console.log(
  "SERVER: Socket handler initialized at",
  new Date().toLocaleTimeString(),
);

// --- SOCKET HANDSHAKE AUTH MIDDLEWARE ---
io.use((socket: any, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    console.log("SOCKET AUTH ERROR: No token provided");
    return next(new Error("Authentication error: Token missing"));
  }

  try {
    const secret = process.env.JWT_SECRET || "";
    const decoded: any = jwt.verify(token, secret);
    socket.user = decoded;
    console.log("SOCKET AUTH SUCCESS: User:", decoded.name, `(${decoded.id})`);
    next();
  } catch (err) {
    console.log("SOCKET AUTH ERROR: Invalid token");
    next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket: any) => {
  console.log(
    "SOCKET: New connection - ID:",
    socket.id,
    "User:",
    socket.user?.name,
    "at",
    new Date().toLocaleTimeString(),
  );

  // Automatically join user to their private room upon authenticated connection
  if (socket.user?.id) {
    const userId = socket.user.id.toString();
    socket.join(userId);
    console.log("SOCKET: User automatically joined setup room:", userId);
  }

  socket.on("setup", (userData: any) => {
    // Keep for legacy reasons if frontend still emits it,
    // but the main joining logic is now in the handshake middleware.
    const userId = (userData?._id || userData?.id)?.toString();
    if (userId) {
      socket.join(userId);
      console.log("SOCKET: User joined setup room (via setup event):", userId);
      socket.emit("connected");
    }
  });

  socket.on("join chat", (room: any) => {
    const roomId = room?.toString();
    if (roomId) {
      socket.join(roomId);
      console.log("User Joined Chat Room:", roomId);
    }
  });

  socket.on("typing", (room: any) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room: any) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved: any) => {
    const chat = newMessageRecieved.chat;

    console.log("=== NEW MESSAGE EVENT ===");
    // Do NOT log the full message data as it might contain huge base64 strings
    console.log("Chat ID:", chat?._id || chat);

    if (!chat) return console.log("ERROR: chat is undefined");
    if (!chat.users) return console.log("ERROR: chat.users not defined");

    console.log("Chat ID:", chat._id);
    console.log("Number of users in chat:", chat.users.length);
    console.log(
      "Sender:",
      newMessageRecieved.sender?._id || newMessageRecieved.sender?.id,
    );

    chat.users.forEach((user: any) => {
      const targetId = (user._id || user.id)?.toString();
      const senderId = (
        newMessageRecieved.sender._id || newMessageRecieved.sender.id
      )?.toString();

      if (targetId === senderId) return;

      console.log(`Sending message to target user: ${targetId}`);
      // Use io.to() to ensure it reaches all sockets the user has open (e.g. multiple tabs)
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
