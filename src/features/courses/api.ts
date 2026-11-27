import { apiRequest, authenticatedApiRequest } from "@/lib/api-client";
import type {
  ApiResponse,
  Course,
  CourseQuery,
  CreateCourseInput,
  PageData,
} from "@/lib/types";

export const coursesApi = {
  list(query?: CourseQuery) {
    return apiRequest<ApiResponse<PageData<Course>>>("/api/v1/courses", {
      query,
    });
  },

  get(courseId: string) {
    return apiRequest<ApiResponse<Course>>(
      `/api/v1/courses/${encodeURIComponent(courseId)}`,
    );
  },

  getOutline<T>(courseId: string) {
    return authenticatedApiRequest<ApiResponse<T>>(
      `/api/v1/courses/${encodeURIComponent(courseId)}/outline`,
      {},
    );
  },

  create(input: CreateCourseInput) {
    return authenticatedApiRequest<ApiResponse<Course>, CreateCourseInput>(
      "/api/v1/courses",
      { body: input, method: "POST" },
    );
  },

  update(
    courseId: string,
    input: Partial<CreateCourseInput> & { expectedVersion: number },
  ) {
    return authenticatedApiRequest<ApiResponse<Course>, typeof input>(
      `/api/v1/courses/${encodeURIComponent(courseId)}`,
      { body: input, method: "PATCH" },
    );
  },

  remove(courseId: string, expectedVersion: number) {
    return authenticatedApiRequest<void, { expectedVersion: number }>(
      `/api/v1/courses/${encodeURIComponent(courseId)}`,
      {
        body: { expectedVersion },
        method: "DELETE",
      },
    );
  },

  listInstructorCourses<T>(
    query?: CourseQuery & { status?: Course["status"] },
  ) {
    return authenticatedApiRequest<ApiResponse<PageData<T>>>(
      "/api/v1/instructor/courses",
      { query },
    );
  },

  enroll<T>(courseId: string, input?: unknown) {
    return authenticatedApiRequest<ApiResponse<T>, unknown>(
      `/api/v1/courses/${encodeURIComponent(courseId)}/enrollments`,
      { body: input, method: "POST" },
    );
  },

  getMyEnrollments<T>(query?: { page?: number; limit?: number }) {
    return authenticatedApiRequest<ApiResponse<PageData<T>>>(
      "/api/v1/enrollments/me",
      { query },
    );
  },

  cancelEnrollment(enrollmentId: string) {
    return authenticatedApiRequest<void>(
      `/api/v1/enrollments/${encodeURIComponent(enrollmentId)}`,
      { method: "DELETE" },
    );
  },
};
