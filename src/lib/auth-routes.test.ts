// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as auth } from "@/app/api/auth/[action]/route";
import {
  GET as gatewayGet,
  POST as gatewayPost,
} from "@/app/api/gateway/[...path]/route";
import { proxy } from "@/proxy";
import { safeReturnPath } from "./auth-path";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
const fetchMock = vi.fn<typeof fetch>();
const user = {
  id: "u1",
  email: "student@example.test",
  role: "STUDENT",
  status: "ACTIVE",
};
function tokenSession() {
  return {
    accessToken: "private-access",
    refreshToken: "private-refresh",
    tokenType: "Bearer",
    expiresIn: 900,
    refreshExpiresAt: new Date(Date.now() + 86400000).toISOString(),
    user,
  };
}
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
function request(
  action: string,
  body?: unknown,
  cookie = "",
  origin = "http://frontend.test",
) {
  return new NextRequest(`http://frontend.test/api/auth/${action}`, {
    method: "POST",
    headers: { origin, cookie, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
const call = (action: string, req = request(action)) =>
  auth(req, { params: Promise.resolve({ action }) });

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  vi.stubEnv("API_GATEWAY_URL", "http://gateway.test");
  vi.stubEnv("AUTH_SESSION_MODE", "single-instance");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("HttpOnly authentication endpoints", () => {
  it("unwraps login, writes HttpOnly cookies and returns only the user", async () => {
    fetchMock.mockResolvedValueOnce(
      json({ data: tokenSession(), meta: { requestId: "r1" } }),
    );
    const response = await call(
      "login",
      request("login", { email: user.email, password: "test-password" }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ user });
    expect(response.cookies.get("lms_access")?.value).toBe("private-access");
    expect(response.headers.get("set-cookie")).toMatch(/HttpOnly/i);
    expect(response.headers.get("set-cookie")).toMatch(/SameSite=lax/i);
  });

  it("uses Secure cookies in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    fetchMock.mockResolvedValueOnce(json({ data: tokenSession() }));
    const response = await call(
      "login",
      request("login", { email: user.email, password: "test-password" }),
    );
    expect(response.headers.get("set-cookie")).toMatch(/Secure/);
  });

  it("rejects cross-origin login before contacting Gateway", async () => {
    expect(
      (await call("login", request("login", {}, "", "https://other.test")))
        .status,
    ).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects malformed credentials", async () => {
    expect(
      (
        await call(
          "login",
          request("login", { email: "invalid", password: "" }),
        )
      ).status,
    ).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("preserves invalid-login status without setting session cookies", async () => {
    fetchMock.mockResolvedValueOnce(
      json({ error: { code: "UNAUTHORIZED" } }, 401),
    );
    const response = await call(
      "login",
      request("login", { email: user.email, password: "wrong" }),
    );
    expect(response.status).toBe(401);
    expect(response.headers.has("set-cookie")).toBe(false);
  });

  it("rejects a malformed token response", async () => {
    fetchMock.mockResolvedValueOnce(
      json({ data: { user, accessToken: "secret" } }),
    );
    const response = await call(
      "login",
      request("login", { email: user.email, password: "test-password" }),
    );
    expect(response.status).toBe(502);
    expect(response.headers.has("set-cookie")).toBe(false);
  });

  it("restores identity by verifying the access token with Identity", async () => {
    fetchMock.mockResolvedValueOnce(
      json({ data: { ...user, unexpected: "not-for-client" } }),
    );
    const response = await call(
      "session",
      request("session", undefined, "lms_access=private-access"),
    );
    expect(await response.json()).toEqual({ user });
    expect(fetchMock).toHaveBeenCalledWith(
      new URL("http://gateway.test/api/v1/users/me"),
      expect.objectContaining({
        headers: { Authorization: "Bearer private-access" },
      }),
    );
  });

  it("rotates an expired session and validates the refreshed identity", async () => {
    fetchMock
      .mockResolvedValueOnce(json({}, 401))
      .mockResolvedValueOnce(json({ data: tokenSession() }))
      .mockResolvedValueOnce(json({ data: user }));
    const response = await call(
      "session",
      request(
        "session",
        undefined,
        "lms_access=expired; lms_refresh=rotation-test",
      ),
    );
    expect(response.status).toBe(200);
    expect(response.cookies.get("lms_refresh")?.value).toBe("private-refresh");
    expect(JSON.stringify(await response.json())).not.toContain(
      "private-refresh",
    );
  });

  it("clears rejected refresh sessions", async () => {
    fetchMock.mockResolvedValueOnce(json({}, 401));
    const response = await call(
      "session",
      request("session", undefined, "lms_refresh=revoked-test"),
    );
    expect(response.status).toBe(401);
    expect(response.cookies.get("lms_refresh")?.value).toBe("");
  });

  it("keeps cookies on temporary Identity failure", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    const response = await call(
      "session",
      request("session", undefined, "lms_access=valid"),
    );
    expect(response.status).toBe(503);
    expect(response.headers.has("set-cookie")).toBe(false);
  });

  it("clears local cookies even if server logout is unavailable", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    const response = await call(
      "logout",
      request("logout", undefined, "lms_refresh=logout-test"),
    );
    expect(response.status).toBe(204);
    expect(response.cookies.get("lms_refresh")?.value).toBe("");
    expect(response.headers.get("x-logout-revocation")).toBe("failed");
  });
});

describe("Cookie Gateway proxy", () => {
  it("refreshes once and preserves a mutation body and idempotency key on retry", async () => {
    fetchMock
      .mockResolvedValueOnce(json({}, 401))
      .mockResolvedValueOnce(json({ data: tokenSession() }))
      .mockResolvedValueOnce(json({ data: { id: "created" } }, 201));
    const req = new NextRequest("http://frontend.test/api/gateway/courses", {
      method: "POST",
      headers: {
        origin: "http://frontend.test",
        cookie: "lms_access=expired; lms_refresh=retry-mutation",
        "Content-Type": "application/json",
        "Idempotency-Key": "action-1",
      },
      body: JSON.stringify({ title: "Course" }),
    });
    const response = await gatewayPost(req, {
      params: Promise.resolve({ path: ["courses"] }),
    });
    expect(response.status).toBe(201);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const retry = fetchMock.mock.calls[2][1]!;
    expect(new TextDecoder().decode(retry.body as ArrayBuffer)).toBe(
      JSON.stringify({ title: "Course" }),
    );
    expect((retry.headers as Headers).get("Idempotency-Key")).toBe("action-1");
    expect(response.cookies.get("lms_access")?.value).toBe("private-access");
  });

  it("does not repeat a request more than once after refresh", async () => {
    fetchMock
      .mockResolvedValueOnce(json({}, 401))
      .mockResolvedValueOnce(json({ data: tokenSession() }))
      .mockResolvedValueOnce(json({}, 401));
    const response = await gatewayGet(
      new NextRequest("http://frontend.test/api/gateway/users/me", {
        headers: { cookie: "lms_refresh=retry-limit" },
      }),
      { params: Promise.resolve({ path: ["users", "me"] }) },
    );
    expect(response.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(response.cookies.get("lms_access")?.value).toBe("");
  });

  it("coalesces simultaneous refreshes for the same session", async () => {
    fetchMock
      .mockResolvedValueOnce(json({ data: tokenSession() }))
      .mockImplementation(async () => json({ data: user }));
    const responses = await Promise.all([
      call(
        "session",
        request("session", undefined, "lms_refresh=concurrent-session"),
      ),
      call(
        "session",
        request("session", undefined, "lms_refresh=concurrent-session"),
      ),
    ]);
    expect(responses.every((response) => response.status === 200)).toBe(true);
    expect(
      fetchMock.mock.calls.filter(([url]) =>
        url.toString().endsWith("/auth/refresh"),
      ),
    ).toHaveLength(1);
  });

  it("uses refresh to revoke all sessions when the access cookie expired", async () => {
    fetchMock
      .mockResolvedValueOnce(json({ data: tokenSession() }))
      .mockResolvedValueOnce(json({ data: {} }));
    const response = await call(
      "logout-all",
      request("logout-all", undefined, "lms_refresh=all-session-test"),
    );
    expect(response.status).toBe(204);
    expect(fetchMock.mock.calls[1][0].toString()).toContain("/auth/logout-all");
    expect(response.cookies.get("lms_refresh")?.value).toBe("");
  });
  it("replaces client identity headers with the cookie Bearer token", async () => {
    fetchMock.mockResolvedValueOnce(json({ data: [] }));
    const req = new NextRequest(
      "http://frontend.test/api/gateway/admin/users?page=2",
      {
        headers: {
          cookie: "lms_access=cookie-token",
          Authorization: "Bearer injected",
          "x-role": "ADMIN",
        },
      },
    );
    const response = await gatewayGet(req, {
      params: Promise.resolve({ path: ["admin", "users"] }),
    });
    expect(response.status).toBe(200);
    const headers = fetchMock.mock.calls[0][1]?.headers as Headers;
    expect(headers.get("authorization")).toBe("Bearer cookie-token");
    expect(headers.has("x-role")).toBe(false);
    expect(fetchMock.mock.calls[0][0].toString()).toContain("?page=2");
  });

  it("blocks internal and token endpoints", async () => {
    for (const path of [
      ["internal", "users"],
      ["auth", "login"],
      ["auth", "refresh"],
    ]) {
      const response = await gatewayGet(
        new NextRequest("http://frontend.test/api/gateway/test"),
        { params: Promise.resolve({ path }) },
      );
      expect(response.status).toBeGreaterThanOrEqual(400);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks cross-origin mutations", async () => {
    const response = await gatewayPost(
      new NextRequest("http://frontend.test/api/gateway/courses", {
        method: "POST",
        headers: { origin: "http://other.test" },
      }),
      { params: Promise.resolve({ path: ["courses"] }) },
    );
    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("preserves a PDF response and download headers", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("pdf-bytes", {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "attachment; filename=certificate.pdf",
        },
      }),
    );
    const response = await gatewayGet(
      new NextRequest("http://frontend.test/api/gateway/download"),
      { params: Promise.resolve({ path: ["download"] }) },
    );
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(await response.text()).toBe("pdf-bytes");
  });
});

describe("Route entry checks", () => {
  it("redirects anonymous users and remembers a safe return path", () => {
    const response = proxy(
      new NextRequest("http://frontend.test/dashboard/admin/users"),
    );
    expect(response.headers.get("location")).toBe(
      "http://frontend.test/login?next=%2Fdashboard%2Fadmin%2Fusers",
    );
  });
  it("sends refresh-only sessions to restore rather than exposing private pages", () => {
    const response = proxy(
      new NextRequest("http://frontend.test/dashboard", {
        headers: { cookie: "lms_refresh=token" },
      }),
    );
    expect(response.headers.get("location")).toContain("/auth/restore?");
  });
  it("rejects external and escaped return destinations", () => {
    for (const path of [
      "https://evil.test",
      "//evil.test",
      "/dashboard/../../login",
      "/dashboard\\evil.test",
    ])
      expect(safeReturnPath(path)).toBe("/dashboard");
    expect(safeReturnPath("/dashboard/instructor/courses?page=2")).toBe(
      "/dashboard/instructor/courses?page=2",
    );
  });
});
