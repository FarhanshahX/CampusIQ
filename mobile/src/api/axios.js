import axios from "axios";

const api = axios.create({
  baseURL: "https://unpearled-denisse-pseudoameboid.ngrok-free.dev/api",
  // baseURL: "http://172.31.78.174:5000/api", // hotspot
  // baseURL: "http://192.168.0.114:5000/api", // wifi
  // baseURL: "http://192.168.1.179:5000/api", // college wifi
});

// Extract base URL without /api suffix for file downloads
export const API_BASE_URL = api.defaults.baseURL.replace("/api", "");

export default api;
