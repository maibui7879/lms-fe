"use client";

import {
  authApi,
  type OAuthProvider,
  type RefreshInput,
  type RegisterInput,
} from "@/features/auth/api";
import { useAuthStore } from "@/store/auth-store";
import type { AuthSession, LoginInput } from "@/lib/types";

export const authService = {
  async login(input: LoginInput): Promise<AuthSession> {
    const session = await authApi.login(input);
    useAuthStore.getState().setSession(session);
    return session;
  },

  register(input: RegisterInput) {
    return authApi.register(input);
  },

  verifyEmail(input: { email: string; otp: string }) {
    return authApi.verifyEmail(input);
  },

  resendOtp(input: { email: string }) {
    return authApi.resendOtp(input);
  },

  requestPasswordReset(input: { email: string }) {
    return authApi.forgotPassword(input);
  },

  resetPassword(input: { email: string; otp: string; newPassword: string }) {
    return authApi.resetPassword(input);
  },

  getOAuthUrl(provider: OAuthProvider) {
    return authApi.getOAuthUrl(provider);
  },

  async refreshSession(): Promise<AuthSession> {
    const refreshToken = useAuthStore.getState().session?.refreshToken;
    if (!refreshToken) {
      throw new Error("No refresh token is available; sign in again");
    }

    const session = await authApi.refresh({ refreshToken });
    useAuthStore.getState().setSession(session);
    return session;
  },

  async logout(): Promise<void> {
    const refreshToken = useAuthStore.getState().session?.refreshToken;
    try {
      if (refreshToken) {
        await authApi.logout({ refreshToken } satisfies RefreshInput);
      }
    } finally {
      useAuthStore.getState().clearSession();
    }
  },

  async logoutAll(): Promise<void> {
    const accessToken = useAuthStore.getState().session?.accessToken;
    if (!accessToken) {
      useAuthStore.getState().clearSession();
      return;
    }

    try {
      await authApi.logoutAll(accessToken);
    } finally {
      useAuthStore.getState().clearSession();
    }
  },
};
