import { learningApi } from "@/features/learning/api";
import { unwrapApiResponse } from "./api-result";

export const learningService = {
  async getDashboard<T>() {
    return unwrapApiResponse(learningApi.getDashboard<T>());
  },

  async getCourseProgress<T>(courseId: string) {
    return unwrapApiResponse(learningApi.getCourseProgress<T>(courseId));
  },

  async getLessonProgress<T>(lessonId: string) {
    return unwrapApiResponse(learningApi.getLessonProgress<T>(lessonId));
  },

  async completeLesson<T>(lessonId: string, input: unknown) {
    return unwrapApiResponse(learningApi.completeLesson<T>(lessonId, input));
  },

  async completeItem<T>(itemId: string, input: unknown) {
    return unwrapApiResponse(learningApi.completeItem<T>(itemId, input));
  },

  async getResume<T>(courseId: string) {
    return unwrapApiResponse(learningApi.getResume<T>(courseId));
  },

  async saveResume<T>(courseId: string, input: unknown) {
    return unwrapApiResponse(learningApi.saveResume<T>(courseId, input));
  },

  async getRecommendations<T>() {
    return unwrapApiResponse(learningApi.getRecommendations<T>());
  },

  async getMyCertificates<T>() {
    return unwrapApiResponse(learningApi.getMyCertificates<T>());
  },

  downloadCertificate(certificateId: string) {
    return learningApi.downloadCertificate(certificateId);
  },

  async verifyCertificate<T>(code: string) {
    return unwrapApiResponse(learningApi.verifyCertificate<T>(code));
  },

  async getQuizScores<T>(courseId: string, mine = true) {
    return unwrapApiResponse(learningApi.getQuizScores<T>(courseId, mine));
  },

  async getInstructorLearners<T>(
    courseId: string,
    query?: { page?: number; limit?: number },
  ) {
    return unwrapApiResponse(
      learningApi.getInstructorLearners<T>(courseId, query),
    );
  },

  async getInstructorAnalytics<T>(courseId: string) {
    return unwrapApiResponse(learningApi.getInstructorAnalytics<T>(courseId));
  },
};
