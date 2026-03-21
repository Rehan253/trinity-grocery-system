import { apiClient } from "@/lib/api/client";
import type {
  AuthUser,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
} from "@/lib/api/types";

export async function registerRequest(
  payload: RegisterPayload,
): Promise<RegisterResponse> {
  const { data } = await apiClient.post<RegisterResponse>("/auth/register", {
    first_name: payload.first_name,
    last_name: payload.last_name,
    email: payload.email,
    password: payload.password,
    phone_number: payload.phone_number,
    address: payload.address,
    zip_code: payload.zip_code,
    city: payload.city,
    country: payload.country,
    state: payload.state?.trim() || undefined,
    role: payload.role ?? "customer",
  });
  return data;
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", {
    email,
    password,
  });
  return data;
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>("/auth/me");
  return data;
}
