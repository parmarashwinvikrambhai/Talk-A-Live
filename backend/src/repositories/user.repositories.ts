import User from "../models/user.model";
import { IUser } from "../types/user-types";

const createUser = async (data: IUser) => {
  const user = new User(data);
  return await user.save();
};
const getUserProfile = async (id: string) => {
  return User.findById(id).select("-password");
};

const searchUsers = async (
  query: string,
  currentUserId: string | undefined,
) => {
  const keyword = query
    ? {
        $or: [
          { name: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
        ],
      }
    : {};

  const users = await User.find(keyword).find({ _id: { $ne: currentUserId } });
  return users;
};

const updateProfilePic = async (id: string, profilePic: string) => {
  return User.findByIdAndUpdate(id, { profilePic }, { new: true }).select(
    "-password",
  );
};

export default {
  createUser,
  getUserProfile,
  searchUsers,
  updateProfilePic,
};
