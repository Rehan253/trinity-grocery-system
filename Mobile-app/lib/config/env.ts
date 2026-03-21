import Constants from "expo-constants";

/**
 * Base URL for the Flask backend (no trailing path segment).
 * Set in `.env` as EXPO_PUBLIC_API_BASE_URL (see `.env.example`).
 * Android emulator: often `http://10.0.2.2:5000`
 * Physical device: use your computer's LAN IP, e.g. `http://192.168.1.10:5000`
 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  const fromExtra = (
    Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined
  )?.apiBaseUrl;

  const raw = (fromEnv ?? fromExtra ?? "http://127.0.0.1:5000").trim();
  return raw.replace(/\/+$/, "");
}
