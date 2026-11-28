export const paths = {
  login: "/login",
  restoreSession: "/auth/restore",
  dashboard: "/dashboard",
  courses: "/dashboard/courses",
  instructorCourses: "/dashboard/instructor/courses",
  newCourse: "/dashboard/instructor/courses/new",
  // Legacy URL only; the Explore page has been removed.
  explore: "/dashboard/explore",
  profile: "/dashboard/profile",
  notifications: "/dashboard/notifications",
  course: (courseId: string) =>
    `/dashboard/courses/${encodeURIComponent(courseId)}`,
} as const;

// Retained for existing callers; no dashboard URL is public.
export function isPublicDashboardPath(_pathname: string) {
  void _pathname;
  return false;
}

export function loginForCourse(courseId: string) {
  return `${paths.login}?next=${encodeURIComponent(paths.course(courseId))}`;
}
