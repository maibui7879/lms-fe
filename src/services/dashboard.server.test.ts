// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { serverApiRequest } from "@/lib/server-api";
import { dashboardServer } from "./dashboard.server";

vi.mock("@/lib/server-api", () => ({ serverApiRequest: vi.fn() }));
beforeEach(() => vi.mocked(serverApiRequest).mockReset());

it("uses the Learning dashboard response for a learner without inventing counters", async () => {
  const data = {
    courses: [],
    recentQuizzes: [],
    updatedAt: "2026-11-28T00:00:00Z",
  };
  vi.mocked(serverApiRequest).mockResolvedValueOnce({ data });
  expect(await dashboardServer.student()).toEqual(data);
  expect(serverApiRequest).toHaveBeenCalledExactlyOnceWith(
    "/api/v1/learning/me/dashboard",
  );
});

it("loads the instructor's own paginated courses", async () => {
  const data = { items: [], total: 0, page: 1, limit: 6 };
  vi.mocked(serverApiRequest).mockResolvedValueOnce({ data });
  expect(await dashboardServer.instructor()).toEqual(data);
  expect(serverApiRequest).toHaveBeenCalledWith("/api/v1/instructor/courses", {
    query: { page: 1, limit: 6 },
  });
});

it("uses backend totals for instructor status cards and distinguishes unavailable data from zero", async () => {
  vi.mocked(serverApiRequest)
    .mockResolvedValueOnce({ data: { total: 4 } })
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce({ data: { total: 0 } });
  expect(await dashboardServer.instructorCounts()).toEqual([4, null, 0]);
  expect(serverApiRequest).toHaveBeenCalledWith("/api/v1/instructor/courses", {
    query: { status: "IN_REVIEW", page: 1, limit: 1 },
  });
});

it("keeps failed admin data unavailable while preserving successful totals", async () => {
  vi.mocked(serverApiRequest)
    .mockResolvedValueOnce({ data: { total: 7 } })
    .mockRejectedValueOnce(new Error("Identity unavailable"))
    .mockResolvedValueOnce({ data: { total: 0 } });
  expect(await dashboardServer.admin()).toEqual([7, null, 0]);
});
