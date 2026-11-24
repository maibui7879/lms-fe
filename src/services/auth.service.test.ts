// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { authApi } from "@/features/auth/api";
import type { AuthSession } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import { authService } from "./auth.service";

vi.mock("@/features/auth/api", () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

const session: AuthSession = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  tokenType: "Bearer",
  expiresIn: 900,
  refreshExpiresAt: "2026-12-01T00:00:00.000Z",
  user: {
    id: "user-1",
    email: "student@example.test",
    role: "STUDENT",
    status: "ACTIVE",
  },
};

describe("authService", () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
    vi.mocked(authApi.login).mockReset();
    vi.mocked(authApi.logout).mockReset();
  });

  it("stores the session after a successful login", async () => {
    vi.mocked(authApi.login).mockResolvedValueOnce(session);

    await expect(
      authService.login({
        email: session.user.email,
        password: "example-password",
      }),
    ).resolves.toEqual(session);

    expect(useAuthStore.getState().session).toEqual(session);
  });

  it("clears the local session while surfacing a logout failure", async () => {
    useAuthStore.getState().setSession(session);
    vi.mocked(authApi.logout).mockRejectedValueOnce(
      new Error("Gateway unavailable"),
    );

    await expect(authService.logout()).rejects.toThrow("Gateway unavailable");
    expect(useAuthStore.getState().session).toBeNull();
  });
});
