import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dashboardQueryKeys } from "@/features/dashboard/lib/query-keys";
import type { RouterLike, ShowToast } from "@/features/dashboard/hooks/workspace.types";
import {
  fetchNotificationsPage,
  markNotificationRead,
} from "@/features/notifications/api/notifications.api";

export function useNotificationsWorkspace({
  copyText,
  handleSessionError,
  router,
  sessionAccessToken,
  setActionBusy,
  setMessage,
  showToast,
}: {
  copyText: (value: string, label: string) => Promise<void>;
  handleSessionError: (error: unknown, fallback: string) => void;
  router: RouterLike;
  sessionAccessToken?: string;
  setActionBusy: (value: string | null) => void;
  setMessage: (value: string) => void;
  showToast: ShowToast;
}) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  const notificationsQuery = useQuery({
    queryKey: dashboardQueryKeys.notificationsPage(sessionAccessToken, {
      page,
      size: 12,
    }),
    queryFn: () =>
      fetchNotificationsPage(sessionAccessToken as string, {
        page: page - 1,
        size: 12,
      }),
    enabled: Boolean(sessionAccessToken),
    placeholderData: (previous) => previous,
  });

  useEffect(() => {
    if (notificationsQuery.error) {
      handleSessionError(notificationsQuery.error, "Could not load notifications");
    }
  }, [handleSessionError, notificationsQuery.error]);

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationRead(sessionAccessToken as string, notificationId),
  });

  async function refreshNotifications() {
    if (!sessionAccessToken) {
      return;
    }

    await queryClient.invalidateQueries({
      queryKey: ["dashboard", "notifications-page", sessionAccessToken],
    });
  }

  async function handleMarkRead(notificationId: string) {
    if (!sessionAccessToken) {
      router.replace("/login");
      return;
    }

    setBusyId(notificationId);
    setActionBusy(`notification-read-${notificationId}`);
    setMessage("Updating notification");

    try {
      await markReadMutation.mutateAsync(notificationId);
      await refreshNotifications();
      showToast({
        title: "Notification updated",
        description: "The notification was marked as read.",
        tone: "success",
      });
    } catch (error) {
      handleSessionError(error, "Could not update notification");
    } finally {
      setBusyId(null);
      setActionBusy(null);
    }
  }

  return {
    busyId,
    error: notificationsQuery.error instanceof Error ? notificationsQuery.error.message : null,
    loading: notificationsQuery.isLoading,
    notifications: notificationsQuery.data?.items ?? [],
    page,
    pageCount: notificationsQuery.data?.totalPages ?? 1,
    refreshNotifications,
    setPage,
    handleMarkRead,
    copyText,
  };
}
