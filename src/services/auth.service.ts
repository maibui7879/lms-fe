"use client";

import {
  authApi,
  type OAuthProvider,
  type RegisterInput,
} from "@/features/auth/api";
import { authRequest } from "@/lib/auth-client";
import { ApiClientError } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import type { ClientSession, LoginInput } from "@/lib/types";

let generation = 0;
let restoring: Promise<ClientSession | null> | null = null;

function notifyTabs(action = "session-changed") {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel("lms-auth");
  channel.postMessage(action);
  channel.close();
}

export function clearClientSession() {
  generation++;
  useAuthStore.getState().clearSession();
}

async function restore(force: boolean) {
  const started = generation;
  try {
    const session = await authRequest(force ? "refresh" : "session");
    if (started === generation) {
      if (session) useAuthStore.getState().setSession(session);
      else useAuthStore.getState().clearSession();
    }
    return started === generation ? session : null;
  } catch (error) {
    if (
      started === generation &&
      error instanceof ApiClientError &&
      error.status === 401
    ) {
      useAuthStore.getState().clearSession();
      return null;
    }
    if (started === generation) useAuthStore.setState({ loading: false });
    throw error;
  }
}

export const authService = {
  async login(input: LoginInput): Promise<ClientSession> {
    const started = ++generation;
    const session = await authApi.login(input);
    if (!session) throw new Error("Không có phiên đăng nhập");
    if (started === generation) {
      useAuthStore.getState().setSession(session);
      notifyTabs();
    }
    return session;
  },
  restoreSession() {
    if (!restoring)
      restoring = restore(false).finally(() => {
        restoring = null;
      });
    return restoring;
  },
  refreshSession() {
    return restore(true);
  },
  async logout() {
    clearClientSession();
    try {
      await authApi.logout();
    } finally {
      notifyTabs("logout");
    }
  },
  async logoutAll() {
    clearClientSession();
    try {
      await authApi.logoutAll();
    } finally {
      notifyTabs("logout");
    }
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
};
