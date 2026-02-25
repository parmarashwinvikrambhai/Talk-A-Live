import Chat from "../models/chat.model";
import User from "../models/user.model";

const accessChat = async (userId: string, currentUserId: string) => {
  // Check if a 1-on-1 chat exists between the two users
  let isChat: any = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: currentUserId } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password")
    .populate("latestMessage");

  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name profilePic email",
  });

  if (isChat.length > 0) {
    return isChat[0];
  } else {
    const chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [currentUserId, userId],
    };

    const createdChat = await Chat.create(chatData);
    const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
      "users",
      "-password",
    );
    return fullChat;
  }
};

const fetchChats = async (currentUserId: string) => {
  try {
    let results: any = await Chat.find({
      users: { $elemMatch: { $eq: currentUserId } },
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    results = await User.populate(results, {
      path: "latestMessage.sender",
      select: "name profilePic email",
    });

    return results;
  } catch (error) {
    throw error;
  }
};

const createGroupChat = async (
  users: string[],
  name: string,
  adminId: string,
) => {
  try {
    const groupChat = await Chat.create({
      chatName: name,
      users: users,
      isGroupChat: true,
      groupAdmin: adminId,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    return fullGroupChat;
  } catch (error) {
    throw error;
  }
};

const addToGroup = async (chatId: string, userId: string) => {
  const updated = await Chat.findByIdAndUpdate(
    chatId,
    { $addToSet: { users: userId } },
    { new: true },
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");
  return updated;
};
const removeFromGroup = async (chatId: string, userId: string) => {
  const updated = await Chat.findByIdAndUpdate(
    chatId,
    { $pull: { users: userId } },
    { new: true },
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");
  return updated;
};

export default {
  accessChat,
  fetchChats,
  createGroupChat,
  addToGroup,
  removeFromGroup
};
