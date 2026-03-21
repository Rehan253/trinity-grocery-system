import axios from "axios";
import {API_BASE_URL} from "../config/env";
import {getToken} from "../storage/authStorage";

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    "bypass-tunnel-reminder": "true",
    "ngrok-skip-browser-warning": "true",
  },
});

http.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
