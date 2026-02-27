import { Request, Response } from "express";
import chatRepositories from "../repositories/chat.repositories";

export const accessChat = async (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) {
    return res
      .status(400)
      .json({ message: "UserId param not sent with request" });
  }
  try {
    const chat = await chatRepositories.accessChat(
      userId,
      req.user?.id as string,
    );
    res.status(200).send(chat);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export const fetchChats = async (req: Request, res: Response) => {
  try {
    const chats = await chatRepositories.fetchChats(req.user?.id as string);
    res.status(200).send(chats);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export const createGroupChat = async (req: Request, res: Response) => {
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
    } catch (e) {
      return res.status(400).json({ message: "Invalid users format" });
    }

    if (!Array.isArray(users)) {
      return res.status(400).json({ message: "Users must be an array" });
    }

    const adminId = req.user?.id || req.user?._id;
    if (!adminId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    const adminIdStr = adminId.toString();
    if (!users.includes(adminIdStr)) {
      users.push(adminIdStr);
    }

    const groupChat = await chatRepositories.createGroupChat(
      users,
      req.body.name,
      adminIdStr,
    );

    res.status(200).json(groupChat);
  } catch (error: any) {
    console.error("CREATE GROUP CRITICAL ERROR:", error);
    res.status(500).json({
      message: "Database Error: " + (error.message || "Unknown error"),
      error: error.message || error,
    });
  }
}

export const addToGroup = async (req: Request, res: Response) => {
  const { chatId, userId } = req.body;
  if (!chatId || !userId) {
    return res.status(400).json({ message: "chatId and userId are required" });
  }
  try {
    const updated = await chatRepositories.addToGroup(chatId, userId);
    if (!updated) return res.status(404).json({ message: "Chat not found" });
    res.status(200).json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
}

export const removeFromGroup = async (req: Request, res: Response) => {
  const { chatId, userId } = req.body;
  if (!chatId || !userId) {
    return res.status(400).json({ message: "chatId and userId are required" });
  }
  try {
    const updated = await chatRepositories.removeFromGroup(chatId, userId);
    if (!updated) return res.status(404).json({ message: "Chat not found" });
    res.status(200).json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
}
