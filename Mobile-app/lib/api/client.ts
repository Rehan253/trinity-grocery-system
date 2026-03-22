import axios, { type AxiosError } from "axios";

import { getApiBaseUrl } from "@/lib/config/env";
import {
  getStoredRefreshToken,
  saveAccessToken,
  clearSession,
} from "@/lib/storage/session";

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

// ── Request interceptor: attach access token ─────────────────────────
apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor: auto-refresh on 401 
let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}[] = [];

function processQueue(error: unknown, token: string | null) {
  for (const p of failedQueue) {
    if (token) {
      p.resolve(token);
    } else {
      p.reject(error);
    }
  }
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };

    // Only attempt refresh on 401, and not on the refresh endpoint itself
    if (
      error.response?.status !== 401 ||
      originalRequest?._retry ||
      originalRequest?.url?.includes("/auth/refresh") ||
      originalRequest?.url?.includes("/auth/login")
    ) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            if (originalRequest) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            }
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await getStoredRefreshToken();
      if (!refreshToken) {
        throw new Error("No refresh token");
      }

      const { data } = await axios.post(
        `${getApiBaseUrl()}/auth/refresh`,
        {},
        { headers: { Authorization: `Bearer ${refreshToken}` } },
      );

      const newToken = data.access_token as string;
      accessToken = newToken;
      await saveAccessToken(newToken);
      processQueue(null, newToken);

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Refresh failed — clear session so user gets sent to login
      accessToken = null;
      await clearSession();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// ── Error helpers ────────────────────────────────────────────────────

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
    if (ax.message) return ax.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
