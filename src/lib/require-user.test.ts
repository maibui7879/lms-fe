// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { requireUser } from "./require-user";

const { cookieGet, cookieHas, fetchMock } = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  cookieHas: vi.fn(),
  fetchMock: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookieGet, has: cookieHas }),
}));
vi.mock("next/navigation", () => ({
  redirect: (target: string) => {
    throw new Error(`REDIRECT:${target}`);
  },
}));

beforeEach(() => {
  cookieGet.mockReset();
  cookieHas.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("Server-side authorization", () => {
  it("does not trust a cookie merely because it exists", async () => {
    cookieGet.mockReturnValue({ value: "forged-token" });
    cookieHas.mockReturnValue(false);
    fetchMock.mockResolvedValue(new Response("{}", { status: 401 }));
    await expect(
      requireUser("/dashboard/admin/users", ["ADMIN"]),
    ).rejects.toThrow("REDIRECT:/login?");
  });
  it("checks the role against verified Identity data", async () => {
    cookieGet.mockReturnValue({ value: "valid-token" });
    fetchMock.mockResolvedValue(
      Response.json({
        data: {
          id: "s1",
          email: "student@example.test",
          role: "STUDENT",
          status: "ACTIVE",
        },
      }),
    );
    await expect(
      requireUser("/dashboard/admin/users", ["ADMIN"]),
    ).rejects.toThrow("REDIRECT:/dashboard");
  });
  it("allows an authorized user and returns no token", async () => {
    cookieGet.mockReturnValue({ value: "valid-token" });
    const user = {
      id: "a1",
      email: "admin@example.test",
      role: "ADMIN",
      status: "ACTIVE",
    };
    fetchMock.mockResolvedValue(Response.json({ data: user }));
    expect(await requireUser("/dashboard/admin/users", ["ADMIN"])).toEqual(
      user,
    );
  });
  it("keeps provider outages distinct from logged-out sessions", async () => {
    cookieGet.mockReturnValue({ value: "valid-token" });
    fetchMock.mockResolvedValue(new Response("{}", { status: 503 }));
    await expect(requireUser("/dashboard")).rejects.toThrow(
      "Không thể xác minh phiên đăng nhập",
    );
  });
});
