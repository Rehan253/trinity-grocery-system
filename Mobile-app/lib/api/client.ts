import axios, { type AxiosError } from "axios";

import { getApiBaseUrl } from "@/lib/config/env";

/** In-memory token for Authorization header (sync with AuthContext). */
let accessToken: string | null = null;

export function setApiAccessToken(token: string | null) {
  accessToken = token;
}

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
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

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong",
): string {
  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError<{ message?: string; msg?: string }>;
    const data = ax.response?.data;
    if (data && typeof data === "object") {
      if (typeof data.message === "string") return data.message;
      if (typeof data.msg === "string") return data.msg;
    }
    if (ax.message) return ax.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
