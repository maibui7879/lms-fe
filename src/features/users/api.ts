import { authenticatedApiRequest } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/types";

export const usersApi = {
  getMe<T>(accessToken: string) {
    return authenticatedApiRequest<ApiResponse<T>>(
      "/api/v1/users/me",
      { accessToken },
    );
  },

  updateMe<T>(accessToken: string, input: unknown) {
    return authenticatedApiRequest<ApiResponse<T>, unknown>(
      "/api/v1/users/me",
      { accessToken, body: input, method: "PATCH" },
    );
  },

  getProfile<T>(accessToken: string) {
    return authenticatedApiRequest<ApiResponse<T>>(
      "/api/v1/users/me/profile",
      { accessToken },
    );
  },

  updateProfile<T>(accessToken: string, input: unknown) {
    return authenticatedApiRequest<ApiResponse<T>, unknown>(
      "/api/v1/users/me/profile",
      { accessToken, body: input, method: "PATCH" },
    );
  },

  deleteProfile(accessToken: string) {
    return authenticatedApiRequest<void>(
      "/api/v1/users/me/profile",
      { accessToken, method: "DELETE" },
    );
  },

  deactivateMe(accessToken: string) {
    return authenticatedApiRequest<void>(
      "/api/v1/users/me",
      { accessToken, method: "DELETE" },
    );
  },

  updatePassword(accessToken: string, input: unknown) {
    return authenticatedApiRequest<unknown, unknown>(
      "/api/v1/users/me/password",
      { accessToken, body: input, method: "POST" },
    );
  },

  getRoleRequests<T>(accessToken: string) {
    return authenticatedApiRequest<ApiResponse<T>>(
      "/api/v1/users/me/role-requests",
      { accessToken },
    );
  },

  createRoleRequest<T>(accessToken: string, input: unknown) {
    return authenticatedApiRequest<ApiResponse<T>, unknown>(
      "/api/v1/users/me/role-requests",
      {
        accessToken,
        body: input,
        method: "POST",
      },
    );
  },
};

export const adminUsersApi = {
  list<T>(accessToken: string, query?: Record<string, string | number>) {
    return authenticatedApiRequest<ApiResponse<T>>(
      "/api/v1/admin/users",
      {
        accessToken,
        query,
      },
    );
  },

  listAudits<T>(accessToken: string, userId: string, query?: object) {
    return authenticatedApiRequest<ApiResponse<T>>(
      `/api/v1/admin/users/${encodeURIComponent(userId)}/audit`,
      { accessToken, query },
    );
  },

  updateRole<T>(
    accessToken: string,
    userId: string,
    input: { role: "ADMIN" | "INSTRUCTOR" | "STUDENT"; reason: string; expectedVersion: number },
  ) {
    return authenticatedApiRequest<ApiResponse<T>, typeof input>(
      `/api/v1/admin/users/${encodeURIComponent(userId)}/role`,
      { accessToken, body: input, method: "PATCH" },
    );
  },

  updateStatus<T>(
    accessToken: string,
    userId: string,
    input: { status: "ACTIVE" | "INACTIVE"; expectedVersion: number },
  ) {
    return authenticatedApiRequest<ApiResponse<T>, typeof input>(
      `/api/v1/admin/users/${encodeURIComponent(userId)}/status`,
      { accessToken, body: input, method: "PATCH" },
    );
  },

  listRoleRequests<T>(accessToken: string) {
    return authenticatedApiRequest<ApiResponse<T>>(
      "/api/v1/admin/users/role-requests",
      { accessToken },
    );
  },

  reviewRoleRequest<T>(accessToken: string, requestId: string, input: unknown) {
    return authenticatedApiRequest<ApiResponse<T>, unknown>(
      `/api/v1/admin/users/role-requests/${encodeURIComponent(requestId)}/review`,
      { accessToken, body: input, method: "PATCH" },
    );
  },
};
