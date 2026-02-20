import { http } from "./http";

export const registerApi = async (payload) => {
  const { data } = await http.post("/auth/register", payload);
  return data;
};

export const loginApi = async (payload) => {
  const { data } = await http.post("/auth/login", payload);
  return data;
};

export const meApi = async () => {
  const { data } = await http.get("/auth/me");
  return data;
};
