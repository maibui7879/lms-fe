import { learningApi } from "@/features/learning/api";
import { unwrapApiResponse } from "./api-result";

export const learningService = {
  async getDashboard<T>(accessToken: string) {
    return unwrapApiResponse(
      learningApi.getDashboard<T>(accessToken),
    );
  },

  async getCourseProgress<T>(accessToken: string, courseId: string) {
    return unwrapApiResponse(
      learningApi.getCourseProgress<T>(accessToken, courseId),
    );
  },

  async getLessonProgress<T>(accessToken: string, lessonId: string) {
    return unwrapApiResponse(
      learningApi.getLessonProgress<T>(accessToken, lessonId),
    );
  },

  async completeLesson<T>(
    accessToken: string,
    lessonId: string,
    input: unknown,
  ) {
    return unwrapApiResponse(
      learningApi.completeLesson<T>(accessToken, lessonId, input),
    );
  },

  async completeItem<T>(
    accessToken: string,
    itemId: string,
    input: unknown,
  ) {
    return unwrapApiResponse(
      learningApi.completeItem<T>(accessToken, itemId, input),
    );
  },

  async getResume<T>(accessToken: string, courseId: string) {
    return unwrapApiResponse(
      learningApi.getResume<T>(accessToken, courseId),
    );
  },

  async saveResume<T>(
    accessToken: string,
    courseId: string,
    input: unknown,
  ) {
    return unwrapApiResponse(
      learningApi.saveResume<T>(accessToken, courseId, input),
    );
  },

  async getRecommendations<T>(accessToken: string) {
    return unwrapApiResponse(
      learningApi.getRecommendations<T>(accessToken),
    );
  },

  async getMyCertificates<T>(accessToken: string) {
    return unwrapApiResponse(
      learningApi.getMyCertificates<T>(accessToken),
    );
  },

  downloadCertificate(accessToken: string, certificateId: string) {
    return learningApi.downloadCertificate(accessToken, certificateId);
  },

  async verifyCertificate<T>(code: string) {
    return unwrapApiResponse(learningApi.verifyCertificate<T>(code));
  },

  async getQuizScores<T>(
    accessToken: string,
    courseId: string,
    mine = true,
  ) {
    return unwrapApiResponse(
      learningApi.getQuizScores<T>(accessToken, courseId, mine),
    );
  },

  async getInstructorLearners<T>(
    accessToken: string,
    courseId: string,
    query?: { page?: number; limit?: number },
  ) {
    return unwrapApiResponse(
      learningApi.getInstructorLearners<T>(accessToken, courseId, query),
    );
  },

  async getInstructorAnalytics<T>(accessToken: string, courseId: string) {
    return unwrapApiResponse(
      learningApi.getInstructorAnalytics<T>(accessToken, courseId),
    );
  },
};
