import axios from "axios";

const api = axios.create({
  baseURL: "https://campusiq-backend.onrender.com/api",
});

export const API_BASE_URL = api.defaults.baseURL.replace("/api", "");

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
