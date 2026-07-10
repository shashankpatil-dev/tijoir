"use client";

import { useDashboardWorkspaceContext } from "@/features/dashboard/components/dashboard-workspace-context";
import { NotificationsView } from "@/features/notifications/components/notifications-view";
import { useNotificationsWorkspace } from "@/features/notifications/hooks/use-notifications-workspace";

export default function DashboardNotificationsPage() {
  const shell = useDashboardWorkspaceContext();
  const notifications = useNotificationsWorkspace({
    copyText: shell.copyText,
    handleSessionError: shell.handleSessionError,
    router: shell.router,
    sessionAccessToken: shell.session?.accessToken ?? undefined,
    setActionBusy: shell.setActionBusy,
    setMessage: shell.setMessage,
    showToast: shell.showToast,
  });

  return (
    <NotificationsView
      busyId={notifications.busyId}
      error={notifications.error}
      loading={notifications.loading}
      notifications={notifications.notifications}
      onCopyLink={notifications.copyText}
      onMarkRead={notifications.handleMarkRead}
      onNextPage={() =>
        notifications.setPage((current) =>
          Math.min(current + 1, Math.max(notifications.pageCount, 1)),
        )
      }
      onPreviousPage={() =>
        notifications.setPage((current) => Math.max(current - 1, 1))
      }
      page={notifications.page}
      pageCount={notifications.pageCount}
    />
  );
}
