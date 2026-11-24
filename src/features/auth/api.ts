import {
  apiRequest,
  authenticatedApiRequest,
  buildApiUrl,
} from "@/lib/api-client";
import type { AuthSession, LoginInput } from "@/lib/types";

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
}

export interface RefreshInput {
  refreshToken: string;
}

export type OAuthProvider = "google" | "github";

export const authApi = {
  getOAuthUrl(provider: OAuthProvider) {
    const path =
      provider === "google" ? "/api/v1/auth/google" : "/api/v1/auth/github";
    return buildApiUrl(path).toString();
  },

  login(input: LoginInput) {
    return apiRequest<AuthSession, LoginInput>("/api/v1/auth/login", {
      body: input,
      method: "POST",
    });
  },

  register(input: RegisterInput) {
    return apiRequest<unknown, RegisterInput>("/api/v1/auth/register", {
      body: input,
      method: "POST",
    });
  },

  refresh(input: RefreshInput) {
    return apiRequest<AuthSession, RefreshInput>("/api/v1/auth/refresh", {
      body: input,
      method: "POST",
    });
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

  logout(input: RefreshInput) {
    return apiRequest<void, RefreshInput>("/api/v1/auth/logout", {
      body: input,
      method: "POST",
    });
  },

  logoutAll(accessToken: string) {
    return authenticatedApiRequest<unknown>("/api/v1/auth/logout-all", {
      accessToken,
      method: "POST",
    });
  },

  getPublicKey<T>() {
    return apiRequest<T>("/api/v1/auth/public-key");
  },
};
