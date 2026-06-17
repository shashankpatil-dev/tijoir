"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useDashboardWorkspace } from "@/features/dashboard/hooks/use-dashboard-workspace";
import type { AuthResponse } from "@/features/auth/types/auth.types";
import type { DashboardHookArgs } from "@/features/dashboard/hooks/workspace.types";

export type DashboardWorkspaceValue = ReturnType<typeof useDashboardWorkspace>;

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
  const workspace = useDashboardWorkspace({
    initialSession,
    pathname,
    removeSession,
    router,
    showToast,
  });

  return (
    <DashboardWorkspaceContext.Provider value={workspace}>
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
