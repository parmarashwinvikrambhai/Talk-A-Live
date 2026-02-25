import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4000/api/v1",
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  const userInfo = localStorage.getItem("userInfo");
  if (userInfo) {
    const { token } = JSON.parse(userInfo);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default API;
