import { notificationsApi } from "@/features/notifications/api";
import type { PageQuery } from "@/lib/types";
import { unwrapApiResponse } from "./api-result";

export const notificationService = {
  async listNotifications(query?: PageQuery & { unreadOnly?: boolean }) {
    return unwrapApiResponse(notificationsApi.list(query));
  },

  async getUnreadCount() {
    return unwrapApiResponse(notificationsApi.getUnreadCount());
  },

  async markNotificationAsRead(notificationId: string) {
    return unwrapApiResponse(notificationsApi.markAsRead(notificationId));
  },
};
