import axios from "axios";

const api = axios.create({
  baseURL: "http://10.241.146.174:5000/api",
  // baseURL: "http://10.113.232.174:5000/api", // hotspot
  // baseURL: "http://192.168.0.114:5000/api", // wifi
});

// Extract base URL without /api suffix for file downloads
export const API_BASE_URL = api.defaults.baseURL.replace("/api", "");

export default api;
