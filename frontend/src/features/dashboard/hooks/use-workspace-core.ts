import { useEffect, useMemo, useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { ApiRequestError } from "@/lib/api/errors";
import { currentUserRequest } from "@/features/auth/api/auth.api";
import { saveSession } from "@/features/auth/lib/auth-storage";
import type { AuthResponse } from "@/features/auth/types/auth.types";
import {
  readWorkspaceCache,
  saveWorkspaceCache,
} from "@/features/dashboard/lib/workspace-cache";
import type { InviteSummary, MemberSummary } from "@/features/members/types/members.types";
import { fetchInvites, fetchMembers } from "@/features/members/api/members.api";
import type { SecretSummary } from "@/features/secrets/types/secrets.types";
import { fetchSecrets } from "@/features/secrets/api/secrets.api";
import { fetchShareLinks } from "@/features/share-links/api/share-links.api";
import type { ShareLinkResponse } from "@/features/share-links/types/share-links.types";
import type { DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { viewFromPath } from "@/features/dashboard/lib/dashboard-routing";
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
  const [message, setMessage] = useState("Loading workspace");
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [shareLinksAvailable, setShareLinksAvailable] = useState(true);
  const [membersAvailable, setMembersAvailable] = useState(true);

  const [secrets, setSecrets] = useState<SecretSummary[]>([]);
  const [shareLinks, setShareLinks] = useState<ShareLinkResponse[]>([]);
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [invites, setInvites] = useState<InviteSummary[]>([]);
  const [selectedSecretId, setSelectedSecretId] = useState("");

  useEffect(() => {
    setSession(initialSession);
    const cached = readWorkspaceCache(initialSession.organization.slug);

    if (cached) {
      setSecrets(cached.secrets);
      setShareLinks(cached.shareLinks);
      setMembers(cached.members || []);
      setInvites(cached.invites || []);
      setSelectedSecretId(cached.selectedSecretId || "");
      setMessage("Session restored. Showing cached workspace while live data loads.");
    } else {
      setMessage("Session restored. Loading organization data.");
    }
  }, [initialSession]);

  useEffect(() => {
    if (!session?.organization.slug) {
      return;
    }

    saveWorkspaceCache(session.organization.slug, {
      secrets,
      shareLinks,
      members,
      invites,
      selectedSecretId,
      activeView,
      updatedAt: new Date().toISOString(),
    });
  }, [activeView, invites, members, secrets, selectedSecretId, session?.organization.slug, shareLinks]);

  const isOrganizationManager = useMemo(
    () => session?.user.role === "ORG_OWNER" || session?.user.role === "ADMIN",
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

  const navigationItems = useMemo<DashboardNavItem[]>(() => {
    const items: DashboardNavItem[] = [
      { id: "overview", label: "Overview", note: "Workspace status" },
      {
        id: "vault",
        label: "Vault",
        note: "Secrets and rotation",
        badge: String(secrets.length),
      },
      {
        id: "share",
        label: "Share Links",
        note: "Vendor access contracts",
        badge: String(activeShareLinks),
      },
    ];

    if (isOrganizationManager) {
      items.push({
        id: "members",
        label: "Members",
        note: "Invites and roles",
        badge: String(members.length),
      });
    }

    items.push({
      id: "recipient",
      label: "Recipient View",
      note: "Public consume test",
    });

    return items;
  }, [activeShareLinks, isOrganizationManager, members.length, secrets.length]);

  function handleSessionError(error: unknown, fallback: string) {
    const text = error instanceof Error ? error.message : fallback;
    if (
      (error instanceof ApiRequestError && error.status === 401) ||
      text.toLowerCase().includes("unauthorized")
    ) {
      removeSession();
      setSession(null);
      router.replace("/login");
      setMessage("Session expired. Login required.");
      showToast({
        title: "Session expired",
        description: "Log in again to continue using the workspace.",
        tone: "warning",
      });
      return;
    }

    setMessage(text || fallback);
    showToast({
      title: "Request failed",
      description: text || fallback,
      tone: "error",
    });
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${label} copied.`);
      showToast({
        title: "Copied",
        description: `${label} copied to the clipboard.`,
        tone: "success",
      });
    } catch {
      setMessage(`Could not copy ${label.toLowerCase()}.`);
      showToast({
        title: "Copy failed",
        description: `Could not copy ${label.toLowerCase()}.`,
        tone: "error",
      });
    }
  }

  const accessToken = session?.accessToken;

  const [meQuery, secretsQuery, shareLinksQuery, membersQuery, invitesQuery] = useQueries({
    queries: [
      {
        queryKey: ["dashboard", "me", accessToken],
        queryFn: () => currentUserRequest(accessToken as string),
        enabled: Boolean(accessToken),
      },
      {
        queryKey: ["dashboard", "secrets", accessToken],
        queryFn: () => fetchSecrets(accessToken as string),
        enabled: Boolean(accessToken),
      },
      {
        queryKey: ["dashboard", "share-links", accessToken],
        queryFn: () => fetchShareLinks(accessToken as string),
        enabled: Boolean(accessToken),
      },
      {
        queryKey: ["dashboard", "members", accessToken],
        queryFn: () => fetchMembers(accessToken as string),
        enabled: Boolean(accessToken),
      },
      {
        queryKey: ["dashboard", "invites", accessToken],
        queryFn: () => fetchInvites(accessToken as string),
        enabled: Boolean(accessToken),
      },
    ],
  });

  useEffect(() => {
    setLoadingWorkspace(
      [meQuery, secretsQuery, shareLinksQuery, membersQuery, invitesQuery].some(
        (query) => query.isFetching,
      ),
    );
  }, [
    invitesQuery.isFetching,
    meQuery.isFetching,
    membersQuery.isFetching,
    secretsQuery.isFetching,
    shareLinksQuery.isFetching,
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
    setSecrets(secretsQuery.data);
    setShareLinksAvailable(!shareLinksQuery.error);
    setMembersAvailable(!membersQuery.error && !invitesQuery.error);
    setShareLinks(shareLinksQuery.data || []);
    setMembers(membersQuery.data || []);
    setInvites(invitesQuery.data || []);

    if (shareLinksQuery.error && membersQuery.error) {
      setMessage(
        "Workspace loaded. Vault data is live, but role-restricted sections are unavailable for this account.",
      );
    } else if (shareLinksQuery.error) {
      setMessage("Workspace loaded. Share-link inventory is not available for this role.");
    } else if (membersQuery.error || invitesQuery.error) {
      setMessage("Workspace loaded. Member management is not available for this role.");
    } else {
      setMessage("Workspace loaded from live backend APIs.");
    }
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
  ]);

  async function loadWorkspace(_accessToken: string) {
    if (!accessToken) {
      return;
    }

    setMessage("Refreshing workspace");
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["dashboard", "me", accessToken] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard", "secrets", accessToken] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard", "share-links", accessToken] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard", "members", accessToken] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard", "invites", accessToken] }),
    ]);
  }

  async function refreshWorkspace() {
    if (!accessToken) {
      router.replace("/login");
      return;
    }

    await loadWorkspace(accessToken);
  }

  function logout() {
    removeSession();
    setSession(null);
    setSecrets([]);
    setShareLinks([]);
    setMembers([]);
    setInvites([]);
    showToast({
      title: "Logged out",
      description: "The workspace session has been cleared.",
      tone: "info",
    });
    router.push("/login");
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
    message,
    navigationItems,
    pendingInvites,
    refreshWorkspace,
    secrets,
    selectedSecretId,
    session,
    setActionBusy,
    setInvites,
    setLoadingWorkspace,
    setMembers,
    setMessage,
    setSelectedSecretId,
    setSecrets,
    setSession,
    setShareLinks,
    setShareLinksAvailable,
    setMembersAvailable,
    shareLinks,
    shareLinksAvailable,
    loadWorkspace,
  };
}
