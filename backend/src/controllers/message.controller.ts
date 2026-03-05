import { Request, Response } from "express";
import * as messageRepositories from "../repositories/message.repositories";

export const sendMessage = async (req: Request, res: Response) => {
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
    console.log(
      "Validation failed: missing chatId or (content and isAudioMessage)",
    );
    return res.sendStatus(400);
  }
  try {
    const message = await messageRepositories.sendMessage(
      req.user?.id as string,
      content,
      chatId,
      isAudioMessage,
      duration,
    );
    console.log("Message successfully created and returning to client");
    res.json(message);
  } catch (error: any) {
    console.error("Error in sendMessage controller:", error.message);
    res.status(400).json({ message: error.message });
  }
  console.log("=== BACKEND SEND_MESSAGE END ===");
};

export const allMessages = async (req: Request, res: Response) => {
  try {
    const messages = await messageRepositories.allMessages(
      req.params.chatId as string,
      req.user?.id as string,
    );
    res.json(messages);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const messageId = req.params.messageId as string;
    const requesterId = req.user?.id as string;

    if (!requesterId) {
      return res
        .status(401)
        .json({ message: "User identity missing from token" });
    }

    const deletedMessage = await messageRepositories.deleteMessage(
      messageId,
      requesterId,
    );

    if (!deletedMessage) {
      console.log("CONTROLLER DELETE ERROR: Repository returned null");
      return res.status(404).json({ message: "Message not found" });
    }

    // Emit real-time event to all users in the chat
    const io = req.app.get("io");
    const chat = deletedMessage.chat as any;
    if (io && chat?.users) {
      chat.users.forEach((user: any) => {
        const targetId = (user._id || user.id || user).toString();
        io.to(targetId).emit("message deleted", deletedMessage);
      });
    }

    res.json(deletedMessage);
  } catch (error: any) {
    console.error("CONTROLLER DELETE CRITICAL ERROR:", error.message);
    res
      .status(error.message?.includes("only delete your own") ? 403 : 400)
      .json({ message: error.message });
  }
};
