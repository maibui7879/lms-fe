import { authenticatedApiRequest } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/types";

export const usersApi = {
  getMe<T>() {
    return authenticatedApiRequest<ApiResponse<T>>("/api/v1/users/me", {});
  },

  updateMe<T>(input: unknown) {
    return authenticatedApiRequest<ApiResponse<T>, unknown>(
      "/api/v1/users/me",
      { body: input, method: "PATCH" },
    );
  },

  getProfile<T>() {
    return authenticatedApiRequest<ApiResponse<T>>(
      "/api/v1/users/me/profile",
      {},
    );
  },

  updateProfile<T>(input: unknown) {
    return authenticatedApiRequest<ApiResponse<T>, unknown>(
      "/api/v1/users/me/profile",
      { body: input, method: "PATCH" },
    );
  },

  deleteProfile() {
    return authenticatedApiRequest<void>("/api/v1/users/me/profile", {
      method: "DELETE",
    });
  },

  deactivateMe() {
    return authenticatedApiRequest<void>("/api/v1/users/me", {
      method: "DELETE",
    });
  },

  updatePassword(input: unknown) {
    return authenticatedApiRequest<unknown, unknown>(
      "/api/v1/users/me/password",
      { body: input, method: "POST" },
    );
  },

  getRoleRequests<T>() {
    return authenticatedApiRequest<ApiResponse<T>>(
      "/api/v1/users/me/role-requests",
      {},
    );
  },

  createRoleRequest<T>(input: unknown) {
    return authenticatedApiRequest<ApiResponse<T>, unknown>(
      "/api/v1/users/me/role-requests",
      {
        body: input,
        method: "POST",
      },
    );
  },
};

export const adminUsersApi = {
  list<T>(query?: Record<string, string | number>) {
    return authenticatedApiRequest<ApiResponse<T>>("/api/v1/admin/users", {
      query,
    });
  },

  listAudits<T>(userId: string, query?: object) {
    return authenticatedApiRequest<ApiResponse<T>>(
      `/api/v1/admin/users/${encodeURIComponent(userId)}/audit`,
      { query },
    );
  },

  updateRole<T>(
    userId: string,
    input: {
      role: "ADMIN" | "INSTRUCTOR" | "STUDENT";
      reason: string;
      expectedVersion: number;
    },
  ) {
    return authenticatedApiRequest<ApiResponse<T>, typeof input>(
      `/api/v1/admin/users/${encodeURIComponent(userId)}/role`,
      { body: input, method: "PATCH" },
    );
  },

  updateStatus<T>(
    userId: string,
    input: { status: "ACTIVE" | "INACTIVE"; expectedVersion: number },
  ) {
    return authenticatedApiRequest<ApiResponse<T>, typeof input>(
      `/api/v1/admin/users/${encodeURIComponent(userId)}/status`,
      { body: input, method: "PATCH" },
    );
  },

  listRoleRequests<T>() {
    return authenticatedApiRequest<ApiResponse<T>>(
      "/api/v1/admin/users/role-requests",
      {},
    );
  },

  reviewRoleRequest<T>(requestId: string, input: unknown) {
    return authenticatedApiRequest<ApiResponse<T>, unknown>(
      `/api/v1/admin/users/role-requests/${encodeURIComponent(requestId)}/review`,
      { body: input, method: "PATCH" },
    );
  },
};
