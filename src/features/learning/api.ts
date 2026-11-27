import { apiRequest, authenticatedApiRequest } from "@/lib/api-client";
import type { ApiResponse, PageQuery } from "@/lib/types";

export const learningApi = {
  getDashboard<T>() {
    return authenticatedApiRequest<ApiResponse<T>>(
      "/api/v1/learning/me/dashboard",
      {},
    );
  },

  getCourseProgress<T>(courseId: string) {
    return authenticatedApiRequest<ApiResponse<T>>(
      `/api/v1/learning/courses/${encodeURIComponent(courseId)}/progress`,
      {},
    );
  },

  getLessonProgress<T>(lessonId: string) {
    return authenticatedApiRequest<ApiResponse<T>>(
      `/api/v1/learning/lessons/${encodeURIComponent(lessonId)}/progress`,
      {},
    );
  },

  completeLesson<T>(lessonId: string, input: unknown) {
    return authenticatedApiRequest<ApiResponse<T>, unknown>(
      `/api/v1/learning/lessons/${encodeURIComponent(lessonId)}/completion`,
      { body: input, method: "PUT" },
    );
  },

  completeItem<T>(itemId: string, input: unknown) {
    return authenticatedApiRequest<ApiResponse<T>, unknown>(
      `/api/v1/learning/items/${encodeURIComponent(itemId)}/completion`,
      { body: input, method: "PUT" },
    );
  },

  getResume<T>(courseId: string) {
    return authenticatedApiRequest<ApiResponse<T | null>>(
      `/api/v1/learning/courses/${encodeURIComponent(courseId)}/resume`,
      {},
    );
  },

  saveResume<T>(courseId: string, input: unknown) {
    return authenticatedApiRequest<ApiResponse<T>, unknown>(
      `/api/v1/learning/courses/${encodeURIComponent(courseId)}/resume`,
      { body: input, method: "PUT" },
    );
  },

  getChapterAccess<T>(courseId: string) {
    return authenticatedApiRequest<ApiResponse<T>>(
      `/api/v1/learning/courses/${encodeURIComponent(courseId)}/chapters/access`,
      {},
    );
  },

  getRecommendations<T>() {
    return authenticatedApiRequest<ApiResponse<T>>(
      "/api/v1/learning/me/recommendations",
      {},
    );
  },

  getMyCertificates<T>() {
    return authenticatedApiRequest<ApiResponse<T>>(
      "/api/v1/learning/me/certificates",
      {},
    );
  },

  downloadCertificate(certificateId: string) {
    return authenticatedApiRequest<Blob>(
      `/api/v1/learning/me/certificates/${encodeURIComponent(certificateId)}/download`,
      {
        responseType: "blob",
      },
    );
  },

  verifyCertificate<T>(code: string) {
    return apiRequest<ApiResponse<T>>(
      `/api/v1/certificates/verify/${encodeURIComponent(code)}`,
    );
  },

  getQuizScores<T>(courseId: string, mine = true) {
    return authenticatedApiRequest<ApiResponse<T>>(
      `/api/v1/learning/courses/${encodeURIComponent(courseId)}/${mine ? "me/" : ""}quiz-scores`,
      {},
    );
  },

  getInstructorLearners<T>(courseId: string, query?: PageQuery) {
    return authenticatedApiRequest<ApiResponse<T>>(
      `/api/v1/learning/courses/${encodeURIComponent(courseId)}/learners`,
      { query },
    );
  },

  getInstructorAnalytics<T>(courseId: string) {
    return authenticatedApiRequest<ApiResponse<T>>(
      `/api/v1/learning/courses/${encodeURIComponent(courseId)}/analytics`,
      {},
    );
  },
};
