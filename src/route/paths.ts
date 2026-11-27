export const paths = {
  login: "/login",
  restoreSession: "/auth/restore",
  dashboard: "/dashboard",
  explore: "/dashboard/explore",
  profile: "/dashboard/profile",
  notifications: "/dashboard/notifications",
  course: (courseId: string) =>
    `/dashboard/courses/${encodeURIComponent(courseId)}`,
} as const;

export function isPublicDashboardPath(pathname: string) {
  return (
    pathname === paths.explore || /^\/dashboard\/courses\/[^/]+$/.test(pathname)
  );
}

export function loginForCourse(courseId: string) {
  return `${paths.login}?next=${encodeURIComponent(paths.course(courseId))}`;
}
