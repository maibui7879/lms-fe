import { notificationsApi } from "@/features/notifications/api";
import type { PageQuery } from "@/lib/types";
import { unwrapApiResponse } from "./api-result";

export const notificationService = {
  async listNotifications(
    accessToken: string,
    query?: PageQuery & { unreadOnly?: boolean },
  ) {
    return unwrapApiResponse(notificationsApi.list(accessToken, query));
  },

  async getUnreadCount(accessToken: string) {
    return unwrapApiResponse(notificationsApi.getUnreadCount(accessToken));
  },

  async markNotificationAsRead(accessToken: string, notificationId: string) {
    return unwrapApiResponse(
      notificationsApi.markAsRead(accessToken, notificationId),
    );
  },
};
