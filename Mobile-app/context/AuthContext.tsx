import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { fetchCurrentUser, loginRequest } from "@/lib/api/auth";
import { getApiErrorMessage, setApiAccessToken } from "@/lib/api/client";
import type { AuthUser } from "@/lib/api/types";
import {
  clearSession,
  getStoredToken,
  getStoredUserJson,
  saveSession,
} from "@/lib/storage/session";

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isReady: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    setApiAccessToken(null);
    await clearSession();
  }, []);

  const refreshUser = useCallback(async () => {
    const t = token ?? (await getStoredToken());
    if (!t) return;
    setApiAccessToken(t);
    const me = await fetchCurrentUser();
    setUser(me);
    await saveSession(t, JSON.stringify(me));
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const storedToken = await getStoredToken();
        const userJson = await getStoredUserJson();

        if (!storedToken) {
          setApiAccessToken(null);
          return;
        }

        setApiAccessToken(storedToken);
        setToken(storedToken);

        if (userJson) {
          try {
            setUser(JSON.parse(userJson) as AuthUser);
          } catch {
            /* ignore corrupt cache */
          }
        }

        try {
          const me = await fetchCurrentUser();
          if (!cancelled) {
            setUser(me);
            await saveSession(storedToken, JSON.stringify(me));
          }
        } catch (e) {
          const status = (e as { response?: { status?: number } })?.response
            ?.status;
          if (status === 401 || status === 422) {
            await clearSession();
            if (!cancelled) {
              setToken(null);
              setUser(null);
              setApiAccessToken(null);
            }
          }
        }
      } finally {
        if (!cancelled) setIsReady(true);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await loginRequest(email.trim(), password);
      setApiAccessToken(res.access_token);
      setToken(res.access_token);
      let profile = res.user;
      try {
        profile = await fetchCurrentUser();
      } catch {
        /* keep login payload if /auth/me fails */
      }
      setUser(profile);
      await saveSession(res.access_token, JSON.stringify(profile), res.refresh_token);
      setLoading(false);
      return true;
    } catch (e) {
      setLoading(false);
      setError(getApiErrorMessage(e, "Login failed"));
      return false;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({
      token,
      user,
      isReady,
      loading,
      error,
      login,
      logout,
      clearError,
      refreshUser,
    }),
    [token, user, isReady, loading, error, login, logout, clearError, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
