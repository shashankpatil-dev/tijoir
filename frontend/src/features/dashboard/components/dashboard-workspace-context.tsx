"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { ApiRequestError } from "@/lib/api/errors";
import { logoutRequest } from "@/features/auth/api/auth.api";
import type { AuthResponse } from "@/features/auth/types/auth.types";
import { clearSession } from "@/features/auth/lib/auth-storage";
import {
  canRoleReviewAudit,
  hasOrganizationManagerRole,
} from "@/features/dashboard/hooks/workspace-core.utils";
import { titleForView, viewFromPath } from "@/features/dashboard/lib/dashboard-routing";
import type { DashboardHookArgs, RouterLike, ShowToast } from "@/features/dashboard/hooks/workspace.types";

type DashboardIntent =
  | "create-secret"
  | "create-share-link"
  | "create-vendor"
  | "create-invite"
  | null;

type RefreshHandler = null | (() => Promise<void> | void);

export type DashboardWorkspaceValue = {
  actionBusy: string | null;
  activeView: ReturnType<typeof viewFromPath>;
  consumeIntent: (intent: Exclude<DashboardIntent, null>) => boolean;
  copyText: (value: string, label: string) => Promise<void>;
  handleSessionError: (error: unknown, fallback: string) => void;
  isOrganizationManager: boolean;
  isRefreshingView: boolean;
  logout: () => Promise<void>;
  navigationItems: Array<{ id: string; label: string; note: string }>;
  refreshCurrentView: () => Promise<void>;
  registerRefreshHandler: (handler: RefreshHandler) => () => void;
  requestCreateInvite: () => void;
  requestCreateSecret: () => void;
  requestCreateShareLink: () => void;
  requestCreateVendor: () => void;
  router: RouterLike;
  session: AuthResponse | null;
  setActionBusy: (value: string | null) => void;
  setMessage: (value: string) => void;
  showCreateInvite: boolean;
  showCreateSecret: boolean;
  showCreateShareLink: boolean;
  showCreateVendor: boolean;
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
  const [pendingIntent, setPendingIntent] = useState<DashboardIntent>(null);
  const [isRefreshingView, setIsRefreshingView] = useState(false);
  const refreshHandlerRef = useRef<RefreshHandler>(null);

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

  const navigationItems = useMemo(() => {
    const items: Array<{ id: string; label: string; note: string }> = [
      { id: "overview", label: "Overview", note: "Workspace status" },
      { id: "vault", label: "Vault", note: "Secrets and rotation" },
      { id: "vendors", label: "Vendors", note: "Entities and contracts" },
      { id: "share", label: "Share Links", note: "Recipient access" },
      { id: "notifications", label: "Notifications", note: "Verification and invite delivery" },
    ];

    if (isOrganizationManager) {
      items.push({
        id: "organization",
        label: "Organization",
        note: "Profile, team and access",
      });
    }

    if (canReviewAudit) {
      items.push({
        id: "audit",
        label: "Audit Log",
        note: "Security activity",
      });
    }

    if (isOrganizationManager) {
      items.push({
        id: "settings",
        label: "Settings",
        note: "Policy and controls",
      });
    }

    items.push({
      id: "recipient",
      label: "Recipient Access",
      note: "Open shared secrets",
    });

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

  const registerRefreshHandler = useCallback((handler: RefreshHandler) => {
    refreshHandlerRef.current = handler;
    return () => {
      if (refreshHandlerRef.current === handler) {
        refreshHandlerRef.current = null;
      }
    };
  }, []);

  const refreshCurrentView = useCallback(async () => {
    if (!refreshHandlerRef.current) {
      return;
    }

    setIsRefreshingView(true);
    try {
      await refreshHandlerRef.current();
    } finally {
      setIsRefreshingView(false);
    }
  }, []);

  const requestCreateSecret = useCallback(() => {
    setPendingIntent("create-secret");
    router.push("/dashboard/vault");
  }, [router]);

  const requestCreateShareLink = useCallback(() => {
    setPendingIntent("create-share-link");
    router.push("/dashboard/share-links");
  }, [router]);

  const requestCreateVendor = useCallback(() => {
    setPendingIntent("create-vendor");
    router.push("/dashboard/vendors");
  }, [router]);

  const requestCreateInvite = useCallback(() => {
    setPendingIntent("create-invite");
    router.push("/dashboard/organization");
  }, [router]);

  const consumeIntent = useCallback((intent: Exclude<DashboardIntent, null>) => {
    if (pendingIntent !== intent) {
      return false;
    }
    setPendingIntent(null);
    return true;
  }, [pendingIntent]);

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
      consumeIntent,
      copyText,
      handleSessionError,
      isOrganizationManager,
      isRefreshingView,
      logout,
      navigationItems,
      refreshCurrentView,
      registerRefreshHandler,
      requestCreateInvite,
      requestCreateSecret,
      requestCreateShareLink,
      requestCreateVendor,
      router,
      session,
      setActionBusy,
      setMessage,
      showCreateInvite: isOrganizationManager,
      showCreateSecret: Boolean(session?.user.role && ["ORG_OWNER", "ADMIN", "MEMBER"].includes(session.user.role)),
      showCreateShareLink: Boolean(session?.user.role && ["ORG_OWNER", "ADMIN", "MEMBER"].includes(session.user.role)),
      showCreateVendor: Boolean(session?.user.role && ["ORG_OWNER", "ADMIN", "MEMBER"].includes(session.user.role)),
      showToast,
      title,
    }),
    [
      actionBusy,
      activeView,
      consumeIntent,
      copyText,
      handleSessionError,
      isOrganizationManager,
      isRefreshingView,
      logout,
      navigationItems,
      refreshCurrentView,
      registerRefreshHandler,
      requestCreateInvite,
      requestCreateSecret,
      requestCreateShareLink,
      requestCreateVendor,
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
