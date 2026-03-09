import { create } from "zustand";
import { loginApi, registerApi, meApi, updateMeApi } from "../api/auth";
import { clearSession, getToken, getUser, saveSession } from "../storage/authStorage";
 
const formatApiError = (error, fallbackMessage) => {
  const data = error?.response?.data;
 
  if (data?.message) return data.message;
  if (data?.msg) return data.msg;
  if (data?.errors && typeof data.errors === "object") {
    return Object.values(data.errors).join(", ");
  }
  if (error?.message) return error.message;
 
  return fallbackMessage;
};
 
const useAuthStore = create((set, get) => ({
  token: null,
  user: null,
  loading: false,
  error: null,
 
  bootstrap: async () => {
    const token = await getToken();
    const user = await getUser();
    if (!token) {
      set({ token: null, user: null });
      return;
    }

    set({ token, user });

    try {
      const me = await meApi();
      await saveSession(token, me);
      set({ user: me });
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401 || status === 422) {
        await clearSession();
        set({ token: null, user: null, error: null });
      }
    }
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
    } catch (_error) {

    }
  },

  updateProfile: async (payload) => {
    set({ loading: true, error: null });
    try {
      const response = await updateMeApi(payload);
      const updatedUser = response?.user || response;
      const token = get().token || (await getToken());
      if (token) {
        await saveSession(token, updatedUser);
      }
      set({ user: updatedUser, loading: false, error: null });
      return { ok: true, user: updatedUser };
    } catch (e) {
      const message = formatApiError(e, "Profile update failed");
      set({ loading: false, error: message });
      return { ok: false, error: message };
    }
  },
 
  logout: async () => {
    await clearSession();
    set({ token: null, user: null, error: null });
  },
}));
 
export default useAuthStore;
