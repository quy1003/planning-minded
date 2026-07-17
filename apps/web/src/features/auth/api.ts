import type { LoginInput, RegisterInput } from "@tripmind/shared";
import { api } from "@/lib/api-client";
import type { AuthUser } from "./types";

export function login(body: LoginInput) {
  return api.post<AuthUser>("/auth/login", body);
}

export function register(body: RegisterInput) {
  return api.post<AuthUser>("/auth/register", body);
}

export function logout() {
  return api.post<void>("/auth/logout");
}

export function getMe() {
  return api.get<AuthUser>("/auth/me");
}
