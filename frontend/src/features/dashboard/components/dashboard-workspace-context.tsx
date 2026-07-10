"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { ApiRequestError } from "@/lib/api/errors";
import { logoutRequest } from "@/features/auth/api/auth.api";
import type { AuthResponse } from "@/features/auth/types/auth.types";
import { clearSession } from "@/features/auth/lib/auth-storage";
import { titleForView, viewFromPath } from "@/features/dashboard/lib/dashboard-routing";
import type { DashboardHookArgs, RouterLike, ShowToast } from "@/features/dashboard/hooks/workspace.types";

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
  navigationItems: Array<{ id: string; label: string }>;
  router: RouterLike;
  session: AuthResponse | null;
  setActionBusy: (value: string | null) => void;
  setMessage: (value: string) => void;
  showToast: ShowToast;
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
    const items: Array<{ id: string; label: string }> = [
      { id: "overview", label: "Overview" },
      { id: "vault", label: "Vault" },
      { id: "vendors", label: "Vendors" },
      { id: "share", label: "Share Links" },
    ];

    return items;
  }, []);

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
      setActionBusy,
      setMessage,
      showToast,
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
      showToast,
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
