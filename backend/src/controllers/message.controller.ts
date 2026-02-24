import { Request, Response } from "express";
import * as messageRepositories from "../repositories/message.repositories";

export const sendMessage = async (req: Request, res: Response) => {
  const { content, chatId } = req.body;
  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }
  try {
    const message = await messageRepositories.sendMessage(
      req.user?.id as string,
      content,
      chatId,
    );
    res.json(message);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export const allMessages = async (req: Request, res: Response) => {
  try {
    const messages = await messageRepositories.allMessages(req.params.chatId as string);
    res.json(messages);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}
