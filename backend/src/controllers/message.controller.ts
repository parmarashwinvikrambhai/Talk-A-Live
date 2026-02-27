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
    );
    res.json(messages);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
