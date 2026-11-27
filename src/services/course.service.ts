import { coursesApi } from "@/features/courses/api";
import type { Course, CourseQuery, CreateCourseInput } from "@/lib/types";
import { unwrapApiResponse } from "./api-result";

export const courseService = {
  async listCourses(query?: CourseQuery) {
    return unwrapApiResponse(coursesApi.list(query));
  },

  async getCourse(courseId: string): Promise<Course> {
    return unwrapApiResponse(coursesApi.get(courseId));
  },

  async getCourseOutline<T>(courseId: string): Promise<T> {
    return unwrapApiResponse(coursesApi.getOutline<T>(courseId));
  },

  async createCourse(input: CreateCourseInput): Promise<Course> {
    return unwrapApiResponse(coursesApi.create(input));
  },

  async updateCourse(
    courseId: string,
    input: Partial<CreateCourseInput> & { expectedVersion: number },
  ): Promise<Course> {
    return unwrapApiResponse(coursesApi.update(courseId, input));
  },

  deleteCourse(courseId: string, expectedVersion: number) {
    return coursesApi.remove(courseId, expectedVersion);
  },

  async listInstructorCourses<T>(
    query?: CourseQuery & { status?: Course["status"] },
  ) {
    return unwrapApiResponse(coursesApi.listInstructorCourses<T>(query));
  },

  async enrollInCourse<T>(courseId: string, input?: unknown): Promise<T> {
    return unwrapApiResponse(coursesApi.enroll<T>(courseId, input));
  },

  async listMyEnrollments<T>(query?: { page?: number; limit?: number }) {
    return unwrapApiResponse(coursesApi.getMyEnrollments<T>(query));
  },

  cancelEnrollment(enrollmentId: string) {
    return coursesApi.cancelEnrollment(enrollmentId);
  },
};
