import { create } from "zustand";
import { loginApi, registerApi, meApi } from "../api/auth";
import { clearSession, getToken, getUser, saveSession } from "../storage/authStorage";
 
const formatApiError = (error, fallbackMessage) => {
  const data = error?.response?.data;
 
  if (data?.message) return data.message;
  if (data?.errors && typeof data.errors === "object") {
    return Object.values(data.errors).join(", ");
  }
  if (error?.message) return error.message;
 
  return fallbackMessage;
};
 
const useAuthStore = create((set) => ({
  token: null,
  user: null,
  loading: false,
  error: null,
 
  bootstrap: async () => {
    const token = await getToken();
    const user = await getUser();
    set({ token, user });
  },
 
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await loginApi({ email, password });
      await saveSession(res.access_token, res.user);
      set({ token: res.access_token, user: res.user, loading: false, error: null });
      return true;
    } catch (e) {
      set({
        loading: false,
        error: formatApiError(e, "Login failed"),
      });
      return false;
    }
  },
 
  signup: async (form) => {
    set({ loading: true, error: null });
    try {
      await registerApi(form);
      set({ loading: false, error: null });
      return true;
    } catch (e) {
      set({
        loading: false,
        error: formatApiError(e, "Signup failed"),
      });
      return false;
    }
  },
 
  refreshMe: async () => {
    try {
      const me = await meApi();
      set({ user: me });
    } catch (e) {

    }
  },
 
  logout: async () => {
    await clearSession();
    set({ token: null, user: null, error: null });
  },
}));
 
export default useAuthStore;