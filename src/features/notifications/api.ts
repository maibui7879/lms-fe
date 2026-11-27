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
  list(query?: PageQuery & { unreadOnly?: boolean }) {
    return authenticatedApiRequest<ApiResponse<PageData<Notification>>>(
      "/api/v1/notifications",
      { query },
    );
  },

  getUnreadCount() {
    return authenticatedApiRequest<ApiResponse<{ count: number }>>(
      "/api/v1/notifications/unread-count",
      {},
    );
  },

  markAsRead(notificationId: string) {
    return authenticatedApiRequest<ApiResponse<Notification>>(
      `/api/v1/notifications/${encodeURIComponent(notificationId)}/read`,
      { method: "PUT" },
    );
  },
};
