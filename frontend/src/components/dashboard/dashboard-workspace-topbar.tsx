"use client";

import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DashboardWorkspaceValue } from "@/features/dashboard/components/dashboard-workspace-context";
import { fetchNotificationsPage, markNotificationRead } from "@/features/notifications/api/notifications.api";
import { dashboardQueryKeys } from "@/features/dashboard/lib/query-keys";
import {
  Bell,
  Building2,
  Check,
  ChevronsUpDown,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Mail,
  Plus,
  Settings,
  Share2,
  ShieldCheck,
  Users,
  UserPlus,
} from "lucide-react";

function withCreateFlag(path: string) {
  return `${path}?create=1`;
}

export function DashboardWorkspaceTopbarActions({
  workspace,
}: {
  workspace: DashboardWorkspaceValue;
}) {
  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="primary">
            <Plus className="size-4" />
            <span>Create</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel>Quick create</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {workspace.canManageSecrets ? (
            <DropdownMenuItem onSelect={() => workspace.router.push(withCreateFlag("/dashboard/vault"))}>
              <KeyRound className="size-4" />
              <span>New secret</span>
            </DropdownMenuItem>
          ) : null}
          {workspace.canManageShareLinks ? (
            <DropdownMenuItem
              onSelect={() => workspace.router.push(withCreateFlag("/dashboard/share-links"))}
            >
              <Share2 className="size-4" />
              <span>New share link</span>
            </DropdownMenuItem>
          ) : null}
          {workspace.canManageVendors ? (
            <DropdownMenuItem onSelect={() => workspace.router.push(withCreateFlag("/dashboard/vendors"))}>
              <Building2 className="size-4" />
              <span>New vendor</span>
            </DropdownMenuItem>
          ) : null}
          {workspace.canManageOrganization ? (
            <DropdownMenuItem
              onSelect={() => workspace.router.push(withCreateFlag("/dashboard/organization"))}
            >
              <Users className="size-4" />
              <span>Invite member</span>
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <DashboardNotificationsBell workspace={workspace} />
    </div>
  );
}

export function DashboardWorkspaceTopbarTitle({
  workspace,
}: {
  workspace: DashboardWorkspaceValue;
}) {
  return (
    <Breadcrumb>
      <BreadcrumbList className="flex-nowrap text-xs">
        <BreadcrumbItem className="shrink-0 text-muted">
          Dashboard
        </BreadcrumbItem>
        <BreadcrumbSeparator className="text-muted" />
        <BreadcrumbItem className="min-w-0">
          <BreadcrumbPage className="truncate text-sm font-semibold text-(--color-ink-strong)">
            {workspace.title}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function DashboardWorkspaceSidebarOrganization({
  workspace,
}: {
  workspace: DashboardWorkspaceValue;
}) {
  const memberships = workspace.session?.memberships.filter((membership) => membership.active) ?? [];

  return (
    <div className="space-y-3">
      <div className="px-1">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/55">
          Tijoir
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="h-auto w-full justify-between rounded-xl px-2.5 py-2.5 text-left text-sidebar-foreground hover:bg-white/10 hover:text-white"
            type="button"
            variant="ghost"
          >
            <span className="flex min-w-0 items-center gap-3">
              <InitialsAvatar
                className="border-white/15 bg-white/5"
                label={workspace.session?.organization.name}
                size="lg"
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  {workspace.session?.organization.name || "Workspace"}
                </span>
                <span className="block truncate text-xs text-sidebar-foreground/65">
                  Organization workspace
                </span>
              </span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-sidebar-foreground/70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Organization</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => workspace.router.push("/dashboard/organization")}>
            <LayoutDashboard className="size-4" />
            <span>Organization settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => workspace.router.push("/dashboard/organization")}>
            <Users className="size-4" />
            <span>Members</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted">
            Switch organization
          </DropdownMenuLabel>
          {memberships.map((membership) => {
            const active = membership.organizationId === workspace.session?.organization.id;
            const switching = membership.organizationId === workspace.switchingOrganizationId;

            return (
              <DropdownMenuItem
                disabled={active || switching}
                key={membership.organizationId}
                onSelect={() => void workspace.switchOrganization(membership.organizationId)}
              >
                <Building2 className="size-4" />
                <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <span className="min-w-0 truncate">{membership.organizationName}</span>
                  {active ? (
                    <Check className="size-4 text-(--color-brand)" />
                  ) : null}
                </span>
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuItem disabled>
            <CreditCard className="size-4" />
            <span>Billing</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function DashboardWorkspaceSidebarUser({
  workspace,
}: {
  workspace: DashboardWorkspaceValue;
}) {
  if (!workspace.session) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="h-auto w-full justify-between rounded-xl px-2.5 py-2.5 text-left text-sidebar-foreground hover:bg-white/10 hover:text-white"
          type="button"
          variant="ghost"
        >
          <span className="flex min-w-0 items-center gap-3">
            <InitialsAvatar
              className="border-white/15 bg-white/5"
              label={workspace.session.user.name}
              size="md"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                {workspace.session.user.name}
              </span>
              <span className="block truncate text-xs text-sidebar-foreground/65">
                {workspace.session.user.role}
              </span>
            </span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-sidebar-foreground/70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64" side="top">
        <DropdownMenuLabel>{workspace.session.user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => workspace.router.push("/dashboard/settings")}>
          <Users className="size-4" />
          <span>Account</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => workspace.router.push("/dashboard/settings")}>
          <Settings className="size-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void workspace.logout()} variant="destructive">
          <LogOut className="size-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DashboardNotificationsBell({
  workspace,
}: {
  workspace: DashboardWorkspaceValue;
}) {
  const queryClient = useQueryClient();
  const accessToken = workspace.session?.accessToken ?? undefined;
  const notificationsQuery = useQuery({
    queryKey: dashboardQueryKeys.notificationsPage(accessToken, {
      page: 0,
      size: 5,
    }),
    queryFn: () =>
      fetchNotificationsPage(accessToken as string, {
        page: 0,
        size: 5,
      }),
    enabled: Boolean(accessToken),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (notificationsQuery.error) {
      workspace.handleSessionError(notificationsQuery.error, "Could not load notifications");
    }
  }, [notificationsQuery.error, workspace.handleSessionError]);

  const markReadMutation = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      await Promise.all(
        notificationIds.map((notificationId) =>
          markNotificationRead(accessToken as string, notificationId),
        ),
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["dashboard", "notifications-page", accessToken],
      });
    },
  });

  const notifications = notificationsQuery.data?.items ?? [];
  const unreadNotifications = notifications.filter((notification) => !notification.readAt);
  const unreadCount = unreadNotifications.length;

  const notificationSummary = useMemo(
    () =>
      notifications.map((notification) => ({
        ...notification,
        relativeTime: formatRelativeTime(notification.createdAt),
      })),
    [notifications],
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label="Open notifications"
          className="relative"
          size="icon"
          type="button"
          variant="outline"
        >
          <Bell className="size-4" />
          {unreadCount ? (
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-(--color-brand)" />
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] rounded-2xl p-0" sideOffset={10}>
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-(--color-ink-strong)">
                Notifications
              </p>
              <p className="text-xs text-muted">
                Verification, invite, and vendor collaboration events.
              </p>
            </div>
            {unreadCount ? (
              <button
                className="text-xs font-semibold text-(--color-brand) transition hover:opacity-80"
                disabled={markReadMutation.isPending}
                onClick={() => void markReadMutation.mutateAsync(unreadNotifications.map((item) => item.id))}
                type="button"
              >
                Mark all as read
              </button>
            ) : null}
          </div>
        </div>

        <div className="max-h-[360px] overflow-y-auto px-2 py-2">
          {notificationsQuery.isLoading && !notificationSummary.length ? (
            <div className="px-3 py-8 text-sm text-muted">
              Loading notifications...
            </div>
          ) : notificationSummary.length ? (
            <div className="space-y-1">
              {notificationSummary.map((notification) => {
                const Icon =
                  notification.type === "ORGANIZATION_INVITE"
                    ? UserPlus
                    : notification.type === "EMAIL_VERIFICATION"
                      || notification.type === "EMAIL_VERIFICATION_RESEND"
                      ? ShieldCheck
                      : notification.type === "VENDOR_CONTRACT_PROPOSED"
                        ? Building2
                        : notification.type === "VENDOR_CONTRACT_ACCEPTED"
                          ? Check
                          : notification.type === "VENDOR_CONTRACT_REJECTED"
                            ? Bell
                            : Mail;

                return (
                  <button
                    className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-(--color-surface)"
                    key={notification.id}
                    onClick={() => {
                      if (!notification.readAt) {
                        void markReadMutation.mutateAsync([notification.id]);
                      }
                      workspace.router.push("/dashboard/notifications");
                    }}
                    type="button"
                  >
                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--color-surface) text-(--color-brand)">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span className="text-sm font-semibold text-(--color-ink-strong)">
                          {notification.title}
                        </span>
                        <span className="shrink-0 text-xs text-muted">
                          {notification.relativeTime}
                        </span>
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-muted">
                        {notification.message}
                      </span>
                    </span>
                    {!notification.readAt ? (
                      <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-(--color-brand)" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-3 py-8 text-sm text-muted">
              No notifications yet.
            </div>
          )}
        </div>

        <div className="border-t border-border px-4 py-3">
          <button
            className="text-sm font-semibold text-(--color-brand) transition hover:opacity-80"
            onClick={() => workspace.router.push("/dashboard/notifications")}
            type="button"
          >
            View all
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, "day");
}
