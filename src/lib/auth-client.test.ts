// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authRequest } from "./auth-client";
const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("client auth transport", () => {
  it("uses the same-origin BFF and strips unexpected token fields", async () => {
    const user = { id: "u1", email: "u@example.test", role: "STUDENT" };
    fetchMock.mockResolvedValue(
      Response.json({ user, accessToken: "secret", refreshToken: "secret" }),
    );
    expect(
      await authRequest("login", { email: user.email, password: "password" }),
    ).toEqual({ user });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ email: user.email, password: "password" }),
      }),
    );
  });
  it("rejects malformed identities instead of storing them", async () => {
    fetchMock.mockResolvedValue(
      Response.json({
        user: { id: "u", email: "invalid", role: "SUPERADMIN" },
      }),
    );
    await expect(authRequest("session")).rejects.toThrow();
  });
  it("preserves backend status and error code", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        { error: { message: "Expired", code: "SESSION_EXPIRED" } },
        { status: 401 },
      ),
    );
    await expect(authRequest("session")).rejects.toMatchObject({
      status: 401,
      code: "SESSION_EXPIRED",
      message: "Expired",
    });
  });
  it("accepts successful logout without trying to parse a JSON body", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    expect(await authRequest("logout")).toBeNull();
  });
  it("reports a failed server revocation after local logout", async () => {
    fetchMock.mockResolvedValue(
      new Response(null, {
        status: 204,
        headers: { "x-logout-revocation": "failed" },
      }),
    );
    await expect(authRequest("logout")).rejects.toThrow("chưa thể thu hồi");
  });
});
