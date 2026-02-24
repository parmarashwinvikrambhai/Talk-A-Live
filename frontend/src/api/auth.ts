import type { LoginPayload, RegisterPayload } from "../types/auth.types";
import API from "../utils/axios";

export const LoginUser = async (data: LoginPayload) => {
  const response = await API.post("/auth/login", data);
  return response.data;
};
export const RegisterUser = async (data: RegisterPayload) => {
  const response = await API.post("/auth/register", data);
  return response.data;
};

export const getProfile = async () => {
  const response = await API.get("/auth/profile");
  return response.data;
};

export const searchUsers = async (query: string) => {
  const response = await API.get(`/auth?search=${query}`);
  return response.data;
};

export const LogoutUser = async () => {
  const response = await API.post("/auth/logout");
  return response.data;
};

export const updateProfilePic = async (profilePic: string) => {
  const response = await API.put("/auth/profile/pic", { profilePic });
  return response.data;
};
