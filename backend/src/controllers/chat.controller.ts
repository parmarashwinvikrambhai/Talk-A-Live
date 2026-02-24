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
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: "Please Fill all the feilds" });
  }
  let users = JSON.parse(req.body.users);
  if (users.length < 2) {
    return res
      .status(400)
      .send("More than 2 users are required to form a group chat");
  }
  users.push(req.user);
  try {
    const groupChat = await chatRepositories.createGroupChat(
      users,
      req.body.name,
      req.user?.id as string,
    );
    res.status(200).json(groupChat);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}
