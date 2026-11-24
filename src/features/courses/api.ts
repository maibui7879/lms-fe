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

  getOutline<T>(courseId: string, accessToken: string) {
    return authenticatedApiRequest<ApiResponse<T>>(
      `/api/v1/courses/${encodeURIComponent(courseId)}/outline`,
      { accessToken },
    );
  },

  create(accessToken: string, input: CreateCourseInput) {
    return authenticatedApiRequest<ApiResponse<Course>, CreateCourseInput>(
      "/api/v1/courses",
      { accessToken, body: input, method: "POST" },
    );
  },

  update(
    accessToken: string,
    courseId: string,
    input: Partial<CreateCourseInput> & { expectedVersion: number },
  ) {
    return authenticatedApiRequest<ApiResponse<Course>, typeof input>(
      `/api/v1/courses/${encodeURIComponent(courseId)}`,
      { accessToken, body: input, method: "PATCH" },
    );
  },

  remove(accessToken: string, courseId: string, expectedVersion: number) {
    return authenticatedApiRequest<void, { expectedVersion: number }>(
      `/api/v1/courses/${encodeURIComponent(courseId)}`,
      {
        accessToken,
        body: { expectedVersion },
        method: "DELETE",
      },
    );
  },

  listInstructorCourses<T>(
    accessToken: string,
    query?: CourseQuery & { status?: Course["status"] },
  ) {
    return authenticatedApiRequest<ApiResponse<PageData<T>>>(
      "/api/v1/instructor/courses",
      { accessToken, query },
    );
  },

  enroll<T>(accessToken: string, courseId: string, input?: unknown) {
    return authenticatedApiRequest<ApiResponse<T>, unknown>(
      `/api/v1/courses/${encodeURIComponent(courseId)}/enrollments`,
      { accessToken, body: input, method: "POST" },
    );
  },

  getMyEnrollments<T>(
    accessToken: string,
    query?: { page?: number; limit?: number },
  ) {
    return authenticatedApiRequest<ApiResponse<PageData<T>>>(
      "/api/v1/enrollments/me",
      { accessToken, query },
    );
  },

  cancelEnrollment(accessToken: string, enrollmentId: string) {
    return authenticatedApiRequest<void>(
      `/api/v1/enrollments/${encodeURIComponent(enrollmentId)}`,
      { accessToken, method: "DELETE" },
    );
  },
};
