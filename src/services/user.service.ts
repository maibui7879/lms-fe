import { adminUsersApi, usersApi } from "@/features/users/api";
import { unwrapApiResponse } from "./api-result";

export const userService = {
  async getCurrentUser<T>(accessToken: string) {
    return unwrapApiResponse(
      usersApi.getMe<T>(accessToken),
    );
  },

  async updateCurrentUser<T>(accessToken: string, input: unknown) {
    return unwrapApiResponse(
      usersApi.updateMe<T>(accessToken, input),
    );
  },

  async getMyProfile<T>(accessToken: string) {
    return unwrapApiResponse(
      usersApi.getProfile<T>(accessToken),
    );
  },

  async updateMyProfile<T>(accessToken: string, input: unknown) {
    return unwrapApiResponse(
      usersApi.updateProfile<T>(accessToken, input),
    );
  },

  deleteMyProfile(accessToken: string) {
    return usersApi.deleteProfile(accessToken);
  },

  deactivateAccount(accessToken: string) {
    return usersApi.deactivateMe(accessToken);
  },

  updatePassword(accessToken: string, input: unknown) {
    return usersApi.updatePassword(accessToken, input);
  },

  async getMyRoleRequests<T>(accessToken: string) {
    return unwrapApiResponse(
      usersApi.getRoleRequests<T>(accessToken),
    );
  },

  async requestRole<T>(accessToken: string, input: unknown) {
    return unwrapApiResponse(
      usersApi.createRoleRequest<T>(accessToken, input),
    );
  },

  async listUsers<T>(
    accessToken: string,
    query?: Record<string, string | number>,
  ) {
    return unwrapApiResponse(
      adminUsersApi.list<T>(accessToken, query),
    );
  },

  async changeUserRole<T>(
    accessToken: string,
    userId: string,
    input: {
      role: "ADMIN" | "INSTRUCTOR" | "STUDENT";
      reason: string;
      expectedVersion: number;
    },
  ) {
    return unwrapApiResponse(
      adminUsersApi.updateRole<T>(
        accessToken,
        userId,
        input,
      ),
    );
  },

  async changeUserStatus<T>(
    accessToken: string,
    userId: string,
    input: { status: "ACTIVE" | "INACTIVE"; expectedVersion: number },
  ) {
    return unwrapApiResponse(
      adminUsersApi.updateStatus<T>(
        accessToken,
        userId,
        input,
      ),
    );
  },
};
