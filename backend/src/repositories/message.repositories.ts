import Message from "../models/message.model";
import Chat from "../models/chat.model";
import User from "../models/user.model";

export const sendMessage = async (
  senderId: string,
  content: string,
  chatId: string,
  isAudio: boolean = false,
  duration?: string,
) => {
  const chat = await Chat.findById(chatId);
  if (!chat) throw new Error("Chat not found");

  const isMember = chat.users.some(
    (userId: any) => userId.toString() === senderId.toString(),
  );
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

  let newMessage = await Message.create({
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

  newMessage = await newMessage.populate("sender", "name profilePic");
  newMessage = await newMessage.populate("chat");
  newMessage = (await User.populate(newMessage, {
    path: "chat.users",
    select: "name profilePic email",
  })) as unknown as typeof newMessage;

  await Chat.findByIdAndUpdate(chatId, { latestMessage: newMessage });

  return newMessage;
};

export const allMessages = async (chatId: string) => {
  const messages = await Message.find({ chat: chatId })
    .populate("sender", "name profilePic email")
    .populate("chat");
  return messages;
};
