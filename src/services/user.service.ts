import { adminUsersApi, usersApi } from "@/features/users/api";
import { unwrapApiResponse } from "./api-result";

export const userService = {
  async getCurrentUser<T>() {
    return unwrapApiResponse(usersApi.getMe<T>());
  },

  async updateCurrentUser<T>(input: unknown) {
    return unwrapApiResponse(usersApi.updateMe<T>(input));
  },

  async getMyProfile<T>() {
    return unwrapApiResponse(usersApi.getProfile<T>());
  },

  async updateMyProfile<T>(input: unknown) {
    return unwrapApiResponse(usersApi.updateProfile<T>(input));
  },

  deleteMyProfile() {
    return usersApi.deleteProfile();
  },

  deactivateAccount() {
    return usersApi.deactivateMe();
  },

  updatePassword(input: unknown) {
    return usersApi.updatePassword(input);
  },

  async getMyRoleRequests<T>() {
    return unwrapApiResponse(usersApi.getRoleRequests<T>());
  },

  async requestRole<T>(input: unknown) {
    return unwrapApiResponse(usersApi.createRoleRequest<T>(input));
  },

  async listUsers<T>(query?: Record<string, string | number>) {
    return unwrapApiResponse(adminUsersApi.list<T>(query));
  },

  async changeUserRole<T>(
    userId: string,
    input: {
      role: "ADMIN" | "INSTRUCTOR" | "STUDENT";
      reason: string;
      expectedVersion: number;
    },
  ) {
    return unwrapApiResponse(adminUsersApi.updateRole<T>(userId, input));
  },

  async changeUserStatus<T>(
    userId: string,
    input: { status: "ACTIVE" | "INACTIVE"; expectedVersion: number },
  ) {
    return unwrapApiResponse(adminUsersApi.updateStatus<T>(userId, input));
  },
};
