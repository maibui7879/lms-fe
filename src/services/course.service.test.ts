import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { courseService } from "./course.service";

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("course service through the browser gateway client", () => {
  it("unwraps paginated data and serializes backend filters", async () => {
    const data = { items: [], total: 0, page: 2, limit: 6 };
    fetchMock.mockResolvedValue(
      Response.json({ data, meta: { requestId: "r1" } }),
    );
    expect(
      await courseService.listCourses({
        search: "a&b",
        category: "Web",
        page: 2,
      }),
    ).toEqual(data);
    const [url, options] = fetchMock.mock.calls[0];
    const parsed = new URL(String(url), "http://local.test");
    expect(parsed.pathname).toBe("/api/gateway/courses");
    expect(parsed.searchParams.get("search")).toBe("a&b");
    expect(parsed.searchParams.get("page")).toBe("2");
    expect(options.credentials).toBe("same-origin");
    expect(new Headers(options.headers).has("authorization")).toBe(false);
  });
  it("rejects IDs that could change path segments before sending a request", async () => {
    await expect(courseService.getCourse("course/one")).rejects.toThrow(
      "Only public /api/v1 Gateway routes",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("sends update version for optimistic concurrency", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ data: { id: "c1", version: 3 } }),
    );
    await courseService.updateCourse("c1", {
      title: "Updated",
      expectedVersion: 2,
    });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "PATCH",
      body: JSON.stringify({ title: "Updated", expectedVersion: 2 }),
    });
  });
  it("preserves conflicts for UI recovery", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        { error: { code: "VERSION_CONFLICT", message: "Reload course" } },
        { status: 409 },
      ),
    );
    await expect(
      courseService.updateCourse("c1", { expectedVersion: 1 }),
    ).rejects.toMatchObject({ status: 409, code: "VERSION_CONFLICT" });
  });
  it("deletes with expectedVersion and accepts an empty 204 response", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await courseService.deleteCourse("c1", 4);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "DELETE",
      body: JSON.stringify({ expectedVersion: 4 }),
    });
  });
  it("posts enrollment without fabricating a student ID", async () => {
    fetchMock.mockResolvedValue(Response.json({ data: { id: "e1" } }));
    expect(await courseService.enrollInCourse("c1")).toEqual({ id: "e1" });
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "/courses/c1/enrollments",
    );
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      body: undefined,
    });
  });
});
