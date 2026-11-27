import { apiRequest, buildApiUrl } from "@/lib/api-client";
import type { LoginInput } from "@/lib/types";
import { authRequest } from "@/lib/auth-client";

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
}

export type OAuthProvider = "google" | "github";

export const authApi = {
  getOAuthUrl(provider: OAuthProvider) {
    const path =
      provider === "google" ? "/api/v1/auth/google" : "/api/v1/auth/github";
    return buildApiUrl(path).toString();
  },

  login(input: LoginInput) {
    return authRequest("login", input);
  },

  register(input: RegisterInput) {
    return apiRequest<unknown, RegisterInput>("/api/v1/auth/register", {
      body: input,
      method: "POST",
    });
  },

  refresh() {
    return authRequest("refresh");
  },

  verifyEmail(input: { email: string; otp: string }) {
    return apiRequest<unknown, typeof input>("/api/v1/auth/verify-email", {
      body: input,
      method: "POST",
    });
  },

  resendOtp(input: { email: string }) {
    return apiRequest<unknown, typeof input>("/api/v1/auth/resend-otp", {
      body: input,
      method: "POST",
    });
  },

  forgotPassword(input: { email: string }) {
    return apiRequest<unknown, typeof input>("/api/v1/auth/forgot-password", {
      body: input,
      method: "POST",
    });
  },

  resetPassword(input: { email: string; otp: string; newPassword: string }) {
    return apiRequest<unknown, typeof input>("/api/v1/auth/reset-password", {
      body: input,
      method: "POST",
    });
  },

  logout() {
    return authRequest("logout");
  },

  logoutAll() {
    return authRequest("logout-all");
  },

  getPublicKey<T>() {
    return apiRequest<T>("/api/v1/auth/public-key");
  },
};
