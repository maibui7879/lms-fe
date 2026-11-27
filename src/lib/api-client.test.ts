// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  apiRequest,
  ApiClientError,
  authenticatedApiRequest,
  buildApiUrl,
} from "./api-client";
import { coursesApi } from "@/features/courses/api";
import { adminUsersApi } from "@/features/users/api";

const fetchMock = vi.fn<typeof fetch>();

describe("Gateway API client", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://gateway.test");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("builds a Gateway URL with repeated array query parameters", () => {
    const url = buildApiUrl("/api/v1/courses", {
      page: 2,
      tag: ["typescript", "react"],
      empty: undefined,
    });

    expect(url.origin).toBe("http://gateway.test");
    expect(url.pathname).toBe("/api/v1/courses");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.getAll("tag")).toEqual(["typescript", "react"]);
    expect(url.searchParams.has("empty")).toBe(false);
  });

  it("sends bearer auth and JSON bodies and returns the decoded response", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { id: "course-1" } }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await apiRequest<
      { data: { id: string } },
      { title: string }
    >("/api/v1/courses", {
      method: "POST",
      body: { title: "TypeScript" },
      accessToken: "access-token",
      idempotencyKey: "create-course-1",
    });

    expect(result.data.id).toBe("course-1");
    expect(fetchMock).toHaveBeenCalledWith(
      new URL("http://gateway.test/api/v1/courses"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ title: "TypeScript" }),
        cache: "no-store",
        headers: expect.any(Headers),
      }),
    );
    const requestHeaders = fetchMock.mock.calls[0][1]?.headers as Headers;
    expect(requestHeaders.get("Authorization")).toBe("Bearer access-token");
    expect(requestHeaders.get("Idempotency-Key")).toBe("create-course-1");
  });

  it("handles the Gateway's no-content response", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(
      apiRequest<void>("/api/v1/auth/logout", { method: "POST" }),
    ).resolves.toBeUndefined();
  });

  it("preserves Gateway error code, request id, and status", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid or missing access token",
            details: {},
          },
          meta: { requestId: "request-123" },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await expect(apiRequest("/api/v1/users/me")).rejects.toMatchObject<
      Partial<ApiClientError>
    >({
      name: "ApiClientError",
      status: 401,
      code: "UNAUTHORIZED",
      requestId: "request-123",
    });
  });

  it("sends a feature request to its explicitly mapped route", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { id: "course-1" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await coursesApi.get("course-1");

    expect(fetchMock).toHaveBeenCalledWith(
      new URL("http://gateway.test/api/v1/courses/course-1"),
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("requires a token for protected feature requests", () => {
    expect(() =>
      authenticatedApiRequest("/api/v1/admin/users", {
        accessToken: "",
      }),
    ).toThrow(ApiClientError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends browser admin requests through the cookie proxy without exposing a token", async () => {
    vi.stubGlobal("window", {
      location: { origin: "http://frontend.test" },
      dispatchEvent: vi.fn(),
    });
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { status: "ACTIVE" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await adminUsersApi.updateStatus("user-1", {
      status: "ACTIVE",
      expectedVersion: 2,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      new URL("http://frontend.test/api/gateway/admin/users/user-1/status"),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "ACTIVE", expectedVersion: 2 }),
      }),
    );
    const headers = fetchMock.mock.calls[0][1]?.headers as Headers;
    expect(headers.has("Authorization")).toBe(false);
  });

  it("rejects internal or non-versioned paths", () => {
    expect(() => buildApiUrl("/api/v1/internal/users")).toThrow(
      "Only public /api/v1 Gateway routes can be requested",
    );
    expect(() => buildApiUrl("/users/me")).toThrow(
      "Only public /api/v1 Gateway routes can be requested",
    );
    expect(() => buildApiUrl("/api/v1/courses/../users/me")).toThrow(
      "Only public /api/v1 Gateway routes can be requested",
    );
  });
});
