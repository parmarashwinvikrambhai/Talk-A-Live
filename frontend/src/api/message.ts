import API from "../utils/axios";

export const sendMessage = async (content: string, chatId: string) => {
  const response = await API.post("/message", { content, chatId });
  return response.data;
};

export const fetchMessages = async (chatId: string) => {
  const response = await API.get(`/message/${chatId}`);
  return response.data;
};
