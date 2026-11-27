// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/[action]/route";
import { GET, POST as gatewayPost } from "@/app/api/gateway/[...path]/route";
import { rotateSession, revokeSession } from "./auth-server";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
const fetchMock = vi.fn<typeof fetch>();
const user = {
  id: "u1",
  email: "a@example.test",
  role: "STUDENT",
  status: "ACTIVE",
};
const json = (data: unknown, status = 200) => Response.json(data, { status });
function pair(key: string) {
  return {
    accessToken: `access-${key}`,
    refreshToken: `next-${key}`,
    tokenType: "Bearer",
    expiresIn: 900,
    refreshExpiresAt: new Date(Date.now() + 86400000).toISOString(),
    user,
  };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function auth(action: string, key: string) {
  return POST(
    new NextRequest(`http://app.test/api/auth/${action}`, {
      method: "POST",
      headers: { origin: "http://app.test", cookie: `lms_refresh=${key}` },
    }),
    { params: Promise.resolve({ action }) },
  );
}
function gateway(key: string) {
  return GET(
    new NextRequest("http://app.test/api/gateway/users/me", {
      headers: { cookie: `lms_refresh=${key}` },
    }),
    { params: Promise.resolve({ path: ["users", "me"] }) },
  );
}
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("AUTH_SESSION_MODE", "single-instance");
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it("does not expire a refresh that is still pending after six seconds", async () => {
  const clock = Date.now();
  const now = vi.spyOn(Date, "now").mockReturnValue(clock);
  const response = deferred<Response>();
  fetchMock.mockReturnValue(response.promise);
  const first = rotateSession("slow-refresh");
  now.mockReturnValue(clock + 6000);
  const second = rotateSession("slow-refresh");
  expect(fetchMock).toHaveBeenCalledTimes(1);
  response.resolve(json({ data: pair("slow") }));
  expect(await first).toEqual(await second);
});

it("follows successive rotations when revoking a session with an older cookie", async () => {
  fetchMock
    .mockResolvedValueOnce(json({ data: pair("chain-first") }))
    .mockResolvedValueOnce(json({ data: pair("chain-second") }));
  await rotateSession("chain-original");
  await rotateSession("next-chain-first");
  expect(await revokeSession("chain-original")).toBe("next-chain-second");
  expect(await rotateSession("next-chain-second")).toBeNull();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it.each(["status", "network"])(
  "keeps rotated cookies when identity verification fails: %s",
  async (failure) => {
    const key = `verify-${failure}`;
    fetchMock.mockResolvedValueOnce(json({ data: pair(key) }));
    if (failure === "status") fetchMock.mockResolvedValueOnce(json({}, 503));
    else fetchMock.mockRejectedValueOnce(new Error("timeout"));
    const response = await auth("session", key);
    expect(response.status).toBe(503);
    expect(response.cookies.get("lms_refresh")?.value).toBe(`next-${key}`);
  },
);

it.each(["network", "redirect"])(
  "keeps rotated cookies when the gateway retry fails: %s",
  async (failure) => {
    const key = `retry-${failure}`;
    fetchMock
      .mockResolvedValueOnce(json({}, 401))
      .mockResolvedValueOnce(json({ data: pair(key) }));
    if (failure === "network")
      fetchMock.mockRejectedValueOnce(new Error("timeout"));
    else fetchMock.mockResolvedValueOnce(new Response(null, { status: 302 }));
    const response = await gateway(key);
    expect(response.status).toBe(failure === "network" ? 503 : 502);
    expect(response.cookies.get("lms_refresh")?.value).toBe(`next-${key}`);
  },
);

it("waits for an in-flight refresh, revokes its successor and prevents session resurrection", async () => {
  const refresh = deferred<Response>();
  const started = deferred<void>();
  fetchMock.mockImplementation(async (url) => {
    if (url.toString().endsWith("/auth/refresh")) {
      started.resolve();
      return refresh.promise;
    }
    return json({ data: {} });
  });
  const restoring = auth("session", "logout-race");
  await started.promise;
  const logout = auth("logout", "logout-race");
  // Allow the logout handler to close refresh admission before rotation resolves.
  await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  await Promise.resolve();
  refresh.resolve(json({ data: pair("logout-race") }));
  const [sessionResponse, logoutResponse] = await Promise.all([
    restoring,
    logout,
  ]);
  expect(logoutResponse.status).toBe(204);
  expect(sessionResponse.status).toBe(401);
  expect(sessionResponse.cookies.get("lms_refresh")?.value).not.toBe(
    "next-logout-race",
  );
  const revoke = fetchMock.mock.calls.find(([url]) =>
    url.toString().endsWith("/auth/logout"),
  );
  expect(JSON.parse(revoke![1]!.body as string)).toEqual({
    refreshToken: "next-logout-race",
  });
  fetchMock.mockClear();
  expect((await gateway("next-logout-race")).status).toBe(401);
  expect(fetchMock).not.toHaveBeenCalled();
});

it.each([true, false])(
  "rejects oversized bodies with or without Content-Length: %s",
  async (withLength) => {
    const response = await gatewayPost(
      new NextRequest("http://app.test/api/gateway/courses", {
        method: "POST",
        headers: {
          origin: "http://app.test",
          ...(withLength ? { "content-length": "2097153" } : {}),
        },
        body: "x".repeat(2097153),
      }),
      { params: Promise.resolve({ path: ["courses"] }) },
    );
    expect(response.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  },
);

it("rejects oversized login bodies before parsing JSON or calling Identity", async () => {
  const response = await POST(
    new NextRequest("http://app.test/api/auth/login", {
      method: "POST",
      headers: { origin: "http://app.test" },
      body: "x".repeat(16385),
    }),
    { params: Promise.resolve({ action: "login" }) },
  );
  expect(response.status).toBe(413);
  expect(fetchMock).not.toHaveBeenCalled();
});

it("fails closed in production without an explicit single-instance configuration", async () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("AUTH_SESSION_MODE", "");
  expect((await auth("session", "deployment-test")).status).toBe(503);
  expect(fetchMock).not.toHaveBeenCalled();
});
