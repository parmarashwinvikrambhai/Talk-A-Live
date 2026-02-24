import API from "../utils/axios";

export const accessChat = async (userId: string) => {
  const response = await API.post("/chat", { userId });
  return response.data;
};

export const fetchChats = async () => {
  const response = await API.get("/chat");
  return response.data;
};

export const createGroupChat = async (users: string[], name: string) => {
  const response = await API.post("/chat/group", {
    users: JSON.stringify(users),
    name,
  });
  return response.data;
};
