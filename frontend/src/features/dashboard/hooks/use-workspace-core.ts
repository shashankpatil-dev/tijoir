import { useEffect, useMemo, useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { ApiRequestError } from "@/lib/api/errors";
import { logoutRequest } from "@/features/auth/api/auth.api";
import { saveSession } from "@/features/auth/lib/auth-storage";
import type { AuthResponse } from "@/features/auth/types/auth.types";
import { saveWorkspaceCache } from "@/features/dashboard/lib/workspace-cache";
import { dashboardQueryKeys } from "@/features/dashboard/lib/query-keys";
import { viewFromPath } from "@/features/dashboard/lib/dashboard-routing";
import { buildWorkspaceQueries } from "@/features/dashboard/hooks/workspace-core.queries";
import {
  buildNavigationItems,
  canRoleReviewAudit,
  EMPTY_WORKSPACE_STATE,
  getCachedWorkspaceState,
  hasOrganizationManagerRole,
} from "@/features/dashboard/hooks/workspace-core.utils";
import type { DashboardHookArgs } from "@/features/dashboard/hooks/workspace.types";

export function useWorkspaceCore({
  initialSession,
  pathname,
  removeSession,
  router,
  showToast,
}: DashboardHookArgs) {
  const activeView = viewFromPath(pathname);
  const queryClient = useQueryClient();

  const [session, setSession] = useState<AuthResponse | null>(initialSession);
  const [message, setMessage] = useState("");
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [cachedWorkspace, setCachedWorkspace] = useState(EMPTY_WORKSPACE_STATE);
  const [selectedSecretId, setSelectedSecretId] = useState("");

  useEffect(() => {
    setSession(initialSession);
    const cached = getCachedWorkspaceState(initialSession);
    setCachedWorkspace(cached.cachedWorkspace);
    setSelectedSecretId(cached.selectedSecretId);
    setMessage("");
  }, [initialSession]);

  const accessToken = session?.accessToken;

  function handleSessionError(error: unknown, fallback: string) {
    const text = error instanceof Error ? error.message : fallback;
    if (
      (error instanceof ApiRequestError && error.status === 401) ||
      text.toLowerCase().includes("unauthorized")
    ) {
      removeSession();
      setSession(null);
      router.replace("/login");
      setMessage("");
      showToast({
        title: "Session expired",
        description: "Log in again to continue using the workspace.",
        tone: "warning",
      });
      return;
    }

      setMessage("");
    showToast({
      title: "Request failed",
      description: text || fallback,
      tone: "error",
    });
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage("");
      showToast({
        title: "Copied",
        description: `${label} copied to the clipboard.`,
        tone: "success",
      });
    } catch {
      setMessage("");
      showToast({
        title: "Copy failed",
        description: `Could not copy ${label.toLowerCase()}.`,
        tone: "error",
      });
    }
  }

  const [meQuery, secretsQuery, vendorsQuery, shareLinksQuery, membersQuery, invitesQuery] =
    useQueries({
      queries: buildWorkspaceQueries(accessToken),
    });

  useEffect(() => {
    setLoadingWorkspace(
      [meQuery, secretsQuery, vendorsQuery, shareLinksQuery, membersQuery, invitesQuery].some(
        (query) => query.isFetching,
      ),
    );
  }, [
    invitesQuery.isFetching,
    meQuery.isFetching,
    membersQuery.isFetching,
    secretsQuery.isFetching,
    shareLinksQuery.isFetching,
    vendorsQuery.isFetching,
  ]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    if (meQuery.error) {
      handleSessionError(meQuery.error, "Could not load workspace");
      return;
    }

    if (secretsQuery.error) {
      handleSessionError(secretsQuery.error, "Could not load workspace");
      return;
    }

    if (!meQuery.data || !secretsQuery.data) {
      return;
    }

    saveSession(meQuery.data);
    setSession(meQuery.data);

    setMessage("");
  }, [
    accessToken,
    invitesQuery.data,
    invitesQuery.error,
    meQuery.data,
    meQuery.error,
    membersQuery.data,
    membersQuery.error,
    secretsQuery.data,
    secretsQuery.error,
    shareLinksQuery.data,
    shareLinksQuery.error,
    vendorsQuery.error,
  ]);

  const secrets = secretsQuery.data ?? cachedWorkspace.secrets;
  const vendors = vendorsQuery.data ?? cachedWorkspace.vendors;
  const shareLinks = shareLinksQuery.data ?? cachedWorkspace.shareLinks;
  const members = membersQuery.data ?? cachedWorkspace.members;
  const invites = invitesQuery.data ?? cachedWorkspace.invites;
  const vendorsAvailable = !accessToken || !vendorsQuery.error;
  const shareLinksAvailable = !accessToken || !shareLinksQuery.error;
  const membersAvailable = !accessToken || (!membersQuery.error && !invitesQuery.error);

  useEffect(() => {
    if (!session?.organization.slug) {
      return;
    }

    saveWorkspaceCache(session.organization.slug, {
      secrets,
      shareLinks,
      vendors,
      members,
      invites,
      selectedSecretId,
      activeView,
      updatedAt: new Date().toISOString(),
    });
  }, [activeView, invites, members, secrets, selectedSecretId, session?.organization.slug, shareLinks, vendors]);

  const isOrganizationManager = useMemo(
    () => hasOrganizationManagerRole(session?.user.role),
    [session?.user.role],
  );

  const canReviewAudit = useMemo(
    () => canRoleReviewAudit(session?.user.role),
    [session?.user.role],
  );

  const activeShareLinks = useMemo(
    () => shareLinks.filter((shareLink) => shareLink.status === "ACTIVE").length,
    [shareLinks],
  );

  const pendingInvites = useMemo(
    () => invites.filter((invite) => invite.status === "PENDING").length,
    [invites],
  );

  const navigationItems = useMemo(
    () =>
      buildNavigationItems({
        activeShareLinks,
        canReviewAudit,
        isOrganizationManager,
        membersCount: members.length,
        secretsCount: secrets.length,
        vendorsCount: vendors.length,
      }),
    [
      activeShareLinks,
      canReviewAudit,
      isOrganizationManager,
      members.length,
      secrets.length,
      vendors.length,
    ],
  );

  async function loadWorkspace(_accessToken: string) {
    if (!accessToken) {
      return;
    }

    setMessage("");
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.me(accessToken) }),
      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.secrets(accessToken) }),
      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.vendors(accessToken) }),
      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.shareLinks(accessToken) }),
      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.members(accessToken) }),
      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.invites(accessToken) }),
      queryClient.invalidateQueries({ queryKey: ["dashboard", "audit-events-page", accessToken] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard", "audit-report", accessToken] }),
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.organizationPolicy(accessToken),
      }),
    ]);
  }

  async function refreshWorkspace() {
    if (!accessToken) {
      router.replace("/login");
      return;
    }

    await loadWorkspace(accessToken);
  }

  async function logout() {
    try {
      await logoutRequest();
    } catch {
      // Ignore remote logout failures and clear local state anyway.
    } finally {
      removeSession();
      setSession(null);
      setCachedWorkspace(EMPTY_WORKSPACE_STATE);
      showToast({
        title: "Logged out",
        description: "The workspace session has been cleared.",
        tone: "info",
      });
      router.push("/login");
    }
  }

  return {
    actionBusy,
    activeShareLinks,
    activeView,
    copyText,
    handleSessionError,
    invites,
    isOrganizationManager,
    loadingWorkspace,
    logout,
    members,
    membersAvailable,
    canReviewAudit,
    message,
    navigationItems,
    pendingInvites,
    refreshWorkspace,
    secrets,
    selectedSecretId,
    session,
    setActionBusy,
    setLoadingWorkspace,
    setMessage,
    setSelectedSecretId,
    setSession,
    shareLinks,
    shareLinksAvailable,
    vendors,
    vendorsAvailable,
    loadWorkspace,
  };
}
