import { authenticatedApiRequest } from "@/lib/api-client";
import type { ApiResponse, PageData, PageQuery } from "@/lib/types";

export interface Notification {
  id: string;
  courseId: string;
  revisionId: string | null;
  type:
    | "ENROLLMENT_SUCCEEDED"
    | "COURSE_APPROVED"
    | "COURSE_REJECTED"
    | "REVISION_APPROVED"
    | "REVISION_REJECTED";
  title: string;
  message: string;
  createdAt: string;
  readAt: string | null;
}

export const notificationsApi = {
  list(accessToken: string, query?: PageQuery & { unreadOnly?: boolean }) {
    return authenticatedApiRequest<ApiResponse<PageData<Notification>>>(
      "/api/v1/notifications",
      { accessToken, query },
    );
  },

  getUnreadCount(accessToken: string) {
    return authenticatedApiRequest<ApiResponse<{ count: number }>>(
      "/api/v1/notifications/unread-count",
      { accessToken },
    );
  },

  markAsRead(accessToken: string, notificationId: string) {
    return authenticatedApiRequest<ApiResponse<Notification>>(
      `/api/v1/notifications/${encodeURIComponent(notificationId)}/read`,
      { accessToken, method: "PUT" },
    );
  },
};
