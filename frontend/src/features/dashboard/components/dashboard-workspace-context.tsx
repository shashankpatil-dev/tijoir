"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { ApiRequestError } from "@/lib/api/errors";
import { logoutRequest, switchOrganizationRequest } from "@/features/auth/api/auth.api";
import type { AuthResponse } from "@/features/auth/types/auth.types";
import { clearSession, saveSession } from "@/features/auth/lib/auth-storage";
import { titleForView, viewFromPath, viewPath } from "@/features/dashboard/lib/dashboard-routing";
import type { DashboardHookArgs, RouterLike, ShowToast } from "@/features/dashboard/hooks/workspace.types";
import {
  Building2,
  KeyRound,
  LayoutDashboard,
  ScrollText,
  Share2,
  Users,
} from "lucide-react";

function hasOrganizationManagerRole(role?: string) {
  return role === "ORG_OWNER" || role === "ADMIN";
}

function canRoleReviewAudit(role?: string) {
  return role === "ORG_OWNER" || role === "ADMIN" || role === "AUDITOR";
}

export type DashboardWorkspaceValue = {
  actionBusy: string | null;
  activeView: ReturnType<typeof viewFromPath>;
  canManageOrganization: boolean;
  canManageSecrets: boolean;
  canManageShareLinks: boolean;
  canManageVendors: boolean;
  canReviewAudit: boolean;
  copyText: (value: string, label: string) => Promise<void>;
  handleSessionError: (error: unknown, fallback: string) => void;
  isOrganizationManager: boolean;
  logout: () => Promise<void>;
  navigationItems: DashboardNavItem[];
  router: RouterLike;
  session: AuthResponse | null;
  setSession: (value: AuthResponse | null) => void;
  setActionBusy: (value: string | null) => void;
  setMessage: (value: string) => void;
  showToast: ShowToast;
  switchOrganization: (organizationId: string) => Promise<void>;
  switchingOrganizationId: string | null;
  title: string;
};

const DashboardWorkspaceContext = createContext<DashboardWorkspaceValue | null>(null);

export function DashboardWorkspaceProvider({
  children,
  initialSession,
  pathname,
  removeSession,
  router,
  showToast,
}: {
  children: ReactNode;
  initialSession: AuthResponse;
  pathname: string;
  removeSession: () => void;
  router: DashboardHookArgs["router"];
  showToast: DashboardHookArgs["showToast"];
}) {
  const [session, setSession] = useState<AuthResponse | null>(initialSession);
  const [message, setMessage] = useState("");
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [switchingOrganizationId, setSwitchingOrganizationId] = useState<string | null>(null);

  const activeView = useMemo(() => viewFromPath(pathname), [pathname]);
  const title = useMemo(() => titleForView(activeView), [activeView]);
  const isOrganizationManager = useMemo(
    () => hasOrganizationManagerRole(session?.user.role),
    [session?.user.role],
  );
  const canReviewAudit = useMemo(
    () => canRoleReviewAudit(session?.user.role),
    [session?.user.role],
  );
  const canManageSecrets = useMemo(
    () => Boolean(session?.user.role && ["ORG_OWNER", "ADMIN", "MEMBER"].includes(session.user.role)),
    [session?.user.role],
  );
  const canManageShareLinks = useMemo(
    () => Boolean(session?.user.role && ["ORG_OWNER", "ADMIN", "MEMBER"].includes(session.user.role)),
    [session?.user.role],
  );
  const canManageVendors = useMemo(
    () => Boolean(session?.user.role && ["ORG_OWNER", "ADMIN", "MEMBER"].includes(session.user.role)),
    [session?.user.role],
  );

  const navigationItems = useMemo(() => {
    const items: DashboardNavItem[] = [
      {
        id: "overview",
        label: "Overview",
        href: "/dashboard/overview",
        icon: LayoutDashboard,
        group: "primary",
      },
      {
        id: "vault",
        label: "Vault",
        href: "/dashboard/vault",
        icon: KeyRound,
        group: "primary",
      },
      {
        id: "share",
        label: "Share Links",
        href: "/dashboard/share-links",
        icon: Share2,
        group: "primary",
      },
      {
        id: "vendors",
        label: "Vendors",
        href: "/dashboard/vendors",
        icon: Building2,
        group: "primary",
      },
      ...(isOrganizationManager
        ? [
            {
              id: "organization",
              label: "Members",
              href: "/dashboard/organization",
              icon: Users,
              group: "team" as const,
            },
          ]
        : []),
      ...(canReviewAudit
        ? [
            {
              id: "audit",
              label: "Audit Log",
              href: "/dashboard/audit",
              icon: ScrollText,
              group: "team" as const,
            },
          ]
        : []),
    ];

    return items;
  }, [canReviewAudit, isOrganizationManager]);

  const handleSessionError = useCallback(
    (error: unknown, fallback: string) => {
      const text = error instanceof Error ? error.message : fallback;
      if (
        (error instanceof ApiRequestError && error.status === 401) ||
        text.toLowerCase().includes("unauthorized")
      ) {
        clearSession();
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
    },
    [removeSession, router, showToast],
  );

  const copyText = useCallback(
    async (value: string, label: string) => {
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
    },
    [showToast],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Ignore remote logout failures and clear local state anyway.
    } finally {
      clearSession();
      removeSession();
      setSession(null);
      showToast({
        title: "Logged out",
        description: "The workspace session has been cleared.",
        tone: "info",
      });
      router.push("/login");
    }
  }, [removeSession, router, showToast]);

  const switchOrganization = useCallback(
    async (organizationId: string) => {
      if (!session?.accessToken || session.organization.id === organizationId) {
        return;
      }

      setSwitchingOrganizationId(organizationId);
      try {
        const nextSession = await switchOrganizationRequest(
          session.accessToken,
          organizationId,
        );
        saveSession(nextSession);
        setSession(nextSession);
        showToast({
          title: "Workspace switched",
          description: `Now working in ${nextSession.organization.name}.`,
          tone: "success",
        });
        router.push(viewPath(activeView));
      } catch (error) {
        handleSessionError(error, "Could not switch organization.");
      } finally {
        setSwitchingOrganizationId(null);
      }
    },
    [activeView, handleSessionError, router, session, showToast],
  );

  const value = useMemo<DashboardWorkspaceValue>(
    () => ({
      actionBusy,
      activeView,
      canManageOrganization: isOrganizationManager,
      canManageSecrets,
      canManageShareLinks,
      canManageVendors,
      canReviewAudit,
      copyText,
      handleSessionError,
      isOrganizationManager,
      logout,
      navigationItems,
      router,
      session,
      setSession,
      setActionBusy,
      setMessage,
      showToast,
      switchOrganization,
      switchingOrganizationId,
      title,
    }),
    [
      actionBusy,
      activeView,
      canManageSecrets,
      canManageShareLinks,
      canManageVendors,
      canReviewAudit,
      copyText,
      handleSessionError,
      isOrganizationManager,
      logout,
      navigationItems,
      router,
      session,
      setSession,
      showToast,
      switchOrganization,
      switchingOrganizationId,
      title,
    ],
  );

  return (
    <DashboardWorkspaceContext.Provider value={value}>
      {children}
    </DashboardWorkspaceContext.Provider>
  );
}

export function useDashboardWorkspaceContext() {
  const value = useContext(DashboardWorkspaceContext);
  if (!value) {
    throw new Error("DashboardWorkspaceContext is not available.");
  }
  return value;
}
