import { coursesApi } from "@/features/courses/api";
import type {
  Course,
  CourseQuery,
  CreateCourseInput,
} from "@/lib/types";
import { unwrapApiResponse } from "./api-result";

export const courseService = {
  async listCourses(query?: CourseQuery) {
    return unwrapApiResponse(coursesApi.list(query));
  },

  async getCourse(courseId: string): Promise<Course> {
    return unwrapApiResponse(coursesApi.get(courseId));
  },

  async getCourseOutline<T>(accessToken: string, courseId: string): Promise<T> {
    return unwrapApiResponse(
      coursesApi.getOutline<T>(courseId, accessToken),
    );
  },

  async createCourse(
    accessToken: string,
    input: CreateCourseInput,
  ): Promise<Course> {
    return unwrapApiResponse(
      coursesApi.create(accessToken, input),
    );
  },

  async updateCourse(
    accessToken: string,
    courseId: string,
    input: Partial<CreateCourseInput> & { expectedVersion: number },
  ): Promise<Course> {
    return unwrapApiResponse(
      coursesApi.update(accessToken, courseId, input),
    );
  },

  deleteCourse(accessToken: string, courseId: string, expectedVersion: number) {
    return coursesApi.remove(accessToken, courseId, expectedVersion);
  },

  async listInstructorCourses<T>(
    accessToken: string,
    query?: CourseQuery & { status?: Course["status"] },
  ) {
    return unwrapApiResponse(
      coursesApi.listInstructorCourses<T>(accessToken, query),
    );
  },

  async enrollInCourse<T>(
    accessToken: string,
    courseId: string,
    input?: unknown,
  ): Promise<T> {
    return unwrapApiResponse(
      coursesApi.enroll<T>(accessToken, courseId, input),
    );
  },

  async listMyEnrollments<T>(
    accessToken: string,
    query?: { page?: number; limit?: number },
  ) {
    return unwrapApiResponse(
      coursesApi.getMyEnrollments<T>(accessToken, query),
    );
  },

  cancelEnrollment(accessToken: string, enrollmentId: string) {
    return coursesApi.cancelEnrollment(accessToken, enrollmentId);
  },
};
