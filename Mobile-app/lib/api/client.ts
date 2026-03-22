import axios, { type AxiosError } from "axios";

import { getApiBaseUrl } from "@/lib/config/env";

/** In-memory token for Authorization header (sync with AuthContext). */
let accessToken: string | null = null;
const API_BASE_URL = getApiBaseUrl();

export function setApiAccessToken(token: string | null) {
  accessToken = token;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 25_000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

type ErrorBody = {
  message?: string;
  msg?: string;
  errors?: Record<string, string>;
};

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong",
): string {
  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError<ErrorBody>;
    if (
      ax.code === "ERR_NETWORK" ||
      ax.message.toLowerCase().includes("network error")
    ) {
      return `Cannot reach backend at ${API_BASE_URL}. Start backend and verify phone can open ${API_BASE_URL}/`;
    }
    const data = ax.response?.data;
    if (data && typeof data === "object") {
      if (typeof data.message === "string") return data.message;
      if (typeof data.msg === "string") return data.msg;
      if (data.errors && typeof data.errors === "object") {
        const parts = Object.values(data.errors).filter(
          (v): v is string => typeof v === "string",
        );
        if (parts.length > 0) return parts.join(" ");
      }
    }
    if (ax.response?.status) {
      return `Request failed (${ax.response.status})`;
    }
    if (ax.message) return ax.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
