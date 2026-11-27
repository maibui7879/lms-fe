import { describe, expect, it } from "vitest";
import {
  canAccessDashboardRoute,
  getDashboardNavigation,
  getDashboardRoute,
  isNavigationActive,
  paths,
} from "./index";

describe("Shared route access configuration", () => {
  it("allows only admins to access user management, including direct URLs", () => {
    const route = getDashboardRoute("/dashboard/admin/users")!;
    expect(canAccessDashboardRoute(route, "ADMIN")).toBe(true);
    for (const role of [null, "STUDENT", "INSTRUCTOR"] as const)
      expect(canAccessDashboardRoute(route, role)).toBe(false);
  });

  it("keeps public explore separate from authenticated profile and overview", () => {
    expect(
      canAccessDashboardRoute(getDashboardRoute(paths.explore)!, null),
    ).toBe(true);
    expect(
      canAccessDashboardRoute(getDashboardRoute(paths.dashboard)!, null),
    ).toBe(false);
    expect(
      canAccessDashboardRoute(getDashboardRoute(paths.profile)!, null),
    ).toBe(false);
    for (const role of ["STUDENT", "INSTRUCTOR", "ADMIN"] as const) {
      expect(
        canAccessDashboardRoute(getDashboardRoute(paths.profile)!, role),
      ).toBe(true);
      expect(
        getDashboardNavigation(role).some(
          (route) => route.href === paths.profile,
        ),
      ).toBe(false);
      expect(
        getDashboardNavigation(role).every((route) =>
          canAccessDashboardRoute(route, role),
        ),
      ).toBe(true);
    }
  });

  it("resolves course details without accepting unknown or overlong paths", () => {
    expect(getDashboardRoute(paths.course("course/one"))?.title).toBe(
      "Khóa học",
    );
    expect(paths.course("course/one")).toBe("/dashboard/courses/course%2Fone");
    expect(getDashboardRoute("/dashboard/courses/a/unknown")).toBeUndefined();
    expect(getDashboardRoute("/dashboard/admin/unknown")).toBeUndefined();
  });

  it("marks nested pages active without confusing similarly named routes", () => {
    expect(
      isNavigationActive(
        "/dashboard/instructor/courses/new",
        "/dashboard/instructor/courses",
      ),
    ).toBe(true);
    expect(
      isNavigationActive(
        "/dashboard/instructor/courses-extra",
        "/dashboard/instructor/courses",
      ),
    ).toBe(false);
    expect(isNavigationActive(paths.profile, paths.dashboard)).toBe(false);
  });
});
