export type UserRole = "STUDENT" | "INSTRUCTOR" | "ADMIN";

export interface ApiResponse<T> {
  data: T;
  meta: {
    requestId: string;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  role: UserRole;
  status?: "ACTIVE" | "INACTIVE";
}

export interface PageData<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export type ApiError = {
  error?: {
    code?: string;
    message?: string | string[];
    details?: unknown;
  };
  meta?: {
    requestId?: string;
  };
  requestId?: string;
  timestamp?: string;
};

export type CourseLevel =
  "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS";

export interface Course {
  id: string;
  instructorId: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  status: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "REJECTED";
  version: number;
  contentVersion: number;
  createdAt: string;
  updatedAt: string;
  subtitle?: string;
  category?: string;
  tags?: string[];
  level?: CourseLevel;
  language?: string;
  prerequisites?: string[];
  targetAudience?: string[];
  learningOutcomes?: string[];
}

export interface CourseQuery {
  page?: number;
  limit?: number;
  search?: string;
  instructorId?: string;
  category?: string;
  tag?: string;
  level?: CourseLevel;
  language?: string;
  sort?: "createdAt" | "title";
  direction?: "asc" | "desc";
}

export interface CreateCourseInput {
  title: string;
  description: string;
  thumbnailUrl?: string | null;
  subtitle?: string;
  category?: string;
  tags?: string[];
  level?: CourseLevel;
  language?: string;
  prerequisites?: string[];
  targetAudience?: string[];
  learningOutcomes?: string[];
  descriptionFormat?: "PLAIN_TEXT" | "HTML";
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshExpiresAt: string;
  user: AuthUser;
}

/** Browser state contains identity only. Tokens stay in HttpOnly cookies. */
export interface ClientSession {
  user: AuthUser;
}

export interface PageQuery {
  page?: number;
  limit?: number;
}

export interface AuthenticatedRequest {
  accessToken: string;
}
