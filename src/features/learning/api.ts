import { apiRequest, authenticatedApiRequest } from "@/lib/api-client";
import type { ApiResponse, PageQuery } from "@/lib/types";

export const learningApi = {
  getDashboard<T>(accessToken: string) {
    return authenticatedApiRequest<ApiResponse<T>>(
      "/api/v1/learning/me/dashboard",
      { accessToken },
    );
  },

  getCourseProgress<T>(accessToken: string, courseId: string) {
    return authenticatedApiRequest<ApiResponse<T>>(
      `/api/v1/learning/courses/${encodeURIComponent(courseId)}/progress`,
      { accessToken },
    );
  },

  getLessonProgress<T>(accessToken: string, lessonId: string) {
    return authenticatedApiRequest<ApiResponse<T>>(
      `/api/v1/learning/lessons/${encodeURIComponent(lessonId)}/progress`,
      { accessToken },
    );
  },

  completeLesson<T>(accessToken: string, lessonId: string, input: unknown) {
    return authenticatedApiRequest<ApiResponse<T>, unknown>(
      `/api/v1/learning/lessons/${encodeURIComponent(lessonId)}/completion`,
      { accessToken, body: input, method: "PUT" },
    );
  },

  completeItem<T>(accessToken: string, itemId: string, input: unknown) {
    return authenticatedApiRequest<ApiResponse<T>, unknown>(
      `/api/v1/learning/items/${encodeURIComponent(itemId)}/completion`,
      { accessToken, body: input, method: "PUT" },
    );
  },

  getResume<T>(accessToken: string, courseId: string) {
    return authenticatedApiRequest<ApiResponse<T | null>>(
      `/api/v1/learning/courses/${encodeURIComponent(courseId)}/resume`,
      { accessToken },
    );
  },

  saveResume<T>(accessToken: string, courseId: string, input: unknown) {
    return authenticatedApiRequest<ApiResponse<T>, unknown>(
      `/api/v1/learning/courses/${encodeURIComponent(courseId)}/resume`,
      { accessToken, body: input, method: "PUT" },
    );
  },

  getChapterAccess<T>(accessToken: string, courseId: string) {
    return authenticatedApiRequest<ApiResponse<T>>(
      `/api/v1/learning/courses/${encodeURIComponent(courseId)}/chapters/access`,
      { accessToken },
    );
  },

  getRecommendations<T>(accessToken: string) {
    return authenticatedApiRequest<ApiResponse<T>>(
      "/api/v1/learning/me/recommendations",
      { accessToken },
    );
  },

  getMyCertificates<T>(accessToken: string) {
    return authenticatedApiRequest<ApiResponse<T>>(
      "/api/v1/learning/me/certificates",
      { accessToken },
    );
  },

  downloadCertificate(accessToken: string, certificateId: string) {
    return authenticatedApiRequest<Blob>(
      `/api/v1/learning/me/certificates/${encodeURIComponent(certificateId)}/download`,
      {
        accessToken,
        responseType: "blob",
      },
    );
  },

  verifyCertificate<T>(code: string) {
    return apiRequest<ApiResponse<T>>(
      `/api/v1/certificates/verify/${encodeURIComponent(code)}`,
    );
  },

  getQuizScores<T>(accessToken: string, courseId: string, mine = true) {
    return authenticatedApiRequest<ApiResponse<T>>(
      `/api/v1/learning/courses/${encodeURIComponent(courseId)}/${mine ? "me/" : ""}quiz-scores`,
      { accessToken },
    );
  },

  getInstructorLearners<T>(
    accessToken: string,
    courseId: string,
    query?: PageQuery,
  ) {
    return authenticatedApiRequest<ApiResponse<T>>(
      `/api/v1/learning/courses/${encodeURIComponent(courseId)}/learners`,
      { accessToken, query },
    );
  },

  getInstructorAnalytics<T>(accessToken: string, courseId: string) {
    return authenticatedApiRequest<ApiResponse<T>>(
      `/api/v1/learning/courses/${encodeURIComponent(courseId)}/analytics`,
      { accessToken },
    );
  },
};
