// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { serverApiRequest } from "./server-api";
const { get, request } = vi.hoisted(() => ({ get: vi.fn(), request: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get }) }));
vi.mock("./api-client", () => ({ authenticatedApiRequest: request }));
beforeEach(() => {
  get.mockReset();
  request.mockReset();
});
it("takes the token from HttpOnly cookies and preserves request options", async () => {
  get.mockReturnValue({ value: "private-token" });
  const data = { data: { id: "c1" } };
  request.mockResolvedValue(data);
  expect(
    await serverApiRequest("/courses/c1", {
      method: "GET",
      query: { page: 2 },
    }),
  ).toEqual(data);
  expect(get).toHaveBeenCalledWith("lms_access");
  expect(request).toHaveBeenCalledWith("/courses/c1", {
    method: "GET",
    query: { page: 2 },
    accessToken: "private-token",
  });
});
it("does not fabricate credentials when the cookie is missing", async () => {
  const failure = new Error("unauthorized");
  request.mockRejectedValue(failure);
  await expect(serverApiRequest("/users/me")).rejects.toBe(failure);
  expect(request).toHaveBeenCalledWith("/users/me", { accessToken: undefined });
});
