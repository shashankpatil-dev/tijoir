import { authenticatedApiRequest } from "@/lib/auth-client";
import type { PageResponse } from "@/lib/api/types";
import type { NotificationSummary } from "@/features/notifications/types/notifications.types";

export async function fetchNotificationsPage(
  accessToken: string,
  params: {
    page?: number;
    size?: number;
  } = {},
) {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page ?? 0));
  searchParams.set("size", String(params.size ?? 12));

  return authenticatedApiRequest<PageResponse<NotificationSummary>>(
    `/api/notifications?${searchParams.toString()}`,
    accessToken,
  );
}

export async function markNotificationRead(
  accessToken: string,
  notificationId: string,
) {
  return authenticatedApiRequest<NotificationSummary>(
    `/api/notifications/${notificationId}/read`,
    accessToken,
    { method: "POST" },
  );
}
