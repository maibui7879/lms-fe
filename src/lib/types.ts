export type UserRole = "student" | "instructor" | "admin";

export type ApiError = {
  statusCode: number;
  message: string | string[];
  error?: string;
};
