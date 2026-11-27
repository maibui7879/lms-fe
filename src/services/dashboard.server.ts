import { serverApiRequest } from "@/lib/server-api";
import type { ApiResponse, Course, PageData } from "@/lib/types";

// Fields rendered below follow the LearningDashboardData contract. They are
// progress of the learner, never progress of authoring a course.
export interface LearningDashboard {
  courses: {
    courseId: string;
    title: string;
    status: string;
    progressPercent: number;
    completedRequiredItems: number;
    totalRequiredItems: number;
    lastActivityAt: string;
  }[];
  recentQuizzes: {
    attemptId: string;
    scorePercent: number;
    passed: boolean;
    gradedAt?: string;
  }[];
  updatedAt: string;
}

export const dashboardServer = {
  async student() {
    return (
      await serverApiRequest<ApiResponse<LearningDashboard>>(
        "/api/v1/learning/me/dashboard",
      )
    ).data;
  },
  async instructor() {
    return (
      await serverApiRequest<ApiResponse<PageData<Course>>>(
        "/api/v1/instructor/courses",
        { query: { page: 1, limit: 6 } },
      )
    ).data;
  },
  async instructorCounts() {
    const results = await Promise.allSettled(
      ["PUBLISHED", "IN_REVIEW", "DRAFT"].map((status) =>
        serverApiRequest<ApiResponse<PageData<Course>>>(
          "/api/v1/instructor/courses",
          { query: { status, page: 1, limit: 1 } },
        ).then((response) => response.data.total),
      ),
    );
    return results.map((result) =>
      result.status === "fulfilled" ? result.value : null,
    );
  },
  async admin() {
    const results = await Promise.allSettled([
      serverApiRequest<ApiResponse<PageData<unknown>>>("/api/v1/admin/users", {
        query: { page: 1, limit: 1 },
      }).then((r) => r.data.total),
      serverApiRequest<ApiResponse<unknown[]>>(
        "/api/v1/admin/users/role-requests",
        { query: { status: "PENDING" } },
      ).then((r) => r.data.length),
      serverApiRequest<ApiResponse<PageData<Course>>>(
        "/api/v1/admin/courses/review-queue",
        { query: { page: 1, limit: 1 } },
      ).then((r) => r.data.total),
    ]);
    return results.map((result) =>
      result.status === "fulfilled" ? result.value : null,
    );
  },
};
