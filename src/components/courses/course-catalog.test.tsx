import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { CatalogView } from "./course-catalog";
import type { Course } from "@/lib/types";
afterEach(cleanup);
const course: Course = {
  id: "c1",
  instructorId: "i1",
  title: "Course title",
  description: "Course description",
  thumbnailUrl: null,
  status: "PUBLISHED",
  version: 1,
  contentVersion: 1,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};
it("renders real data without invented ratings, price or duration", () => {
  render(
    <CatalogView
      courses={{ items: [course], total: 1, page: 1, limit: 6 }}
      query={{}}
      basePath="/dashboard"
    />,
  );
  expect(
    screen.getByRole("heading", { name: course.title }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Course title" })).toHaveAttribute(
    "href",
    "/dashboard/courses/c1",
  );
  expect(screen.getByText(course.description)).toBeInTheDocument();
  expect(
    screen.queryByText(/rating|đánh giá|giờ|miễn phí/i),
  ).not.toBeInTheDocument();
});
it("offers filter recovery when no matching courses exist", () => {
  render(
    <CatalogView
      courses={{ items: [], total: 0, page: 1, limit: 6 }}
      query={{ level: "ADVANCED" }}
      basePath="/dashboard"
    />,
  );
  expect(
    screen.getByRole("heading", { name: "Không tìm thấy khóa học" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Xóa bộ lọc" })).toHaveAttribute(
    "href",
    "/dashboard",
  );
});
it("keeps filters in search submissions and page links", () => {
  render(
    <CatalogView
      courses={{ items: [], total: 12, page: 1, limit: 6 }}
      query={{
        search: "React",
        category: "Web",
        level: "BEGINNER",
        sort: "title",
        direction: "asc",
      }}
      basePath="/dashboard"
    />,
  );
  expect(screen.getByRole("search")).toHaveAttribute("action", "/dashboard");
  expect(screen.getByRole("searchbox")).toHaveValue("React");
  const href = screen
    .getByRole("link", { name: /Trang sau/ })
    .getAttribute("href")!;
  expect(new URL(href, "http://local.test").searchParams.get("level")).toBe(
    "BEGINNER",
  );
});
