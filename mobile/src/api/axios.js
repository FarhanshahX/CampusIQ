import axios from "axios";

const api = axios.create({
  baseURL: "https://campusiq-backend.onrender.com/api",
});

// Extract base URL without /api suffix for file downloads
export const API_BASE_URL = api.defaults.baseURL.replace("/api", "");

export default api;
