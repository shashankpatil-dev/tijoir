"use client";

import type { ReactNode } from "react";
import { DashboardSectionHeader, DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardWorkspaceConfirmations } from "@/components/dashboard/dashboard-workspace-confirmations";
import { DashboardWorkspaceDialogs } from "@/components/dashboard/dashboard-workspace-dialogs";
import {
  DashboardWorkspaceTopbarActions,
  DashboardWorkspaceUserMeta,
} from "@/components/dashboard/dashboard-workspace-topbar";
import { BusyOverlay } from "@/components/ui/feedback";
import { useDashboardWorkspaceContext } from "@/features/dashboard/components/dashboard-workspace-context";
import { viewPath, type DashboardViewKey } from "@/features/dashboard/lib/dashboard-routing";

export function DashboardWorkspaceApp({ children }: { children: ReactNode }) {
  const workspace = useDashboardWorkspaceContext();

  return (
    <DashboardShell
      activeItemId={workspace.activeView}
      items={workspace.navigationItems}
      onSelect={(value) => workspace.router.push(viewPath(value as DashboardViewKey))}
      topbarActions={<DashboardWorkspaceTopbarActions workspace={workspace} />}
      userMeta={<DashboardWorkspaceUserMeta workspace={workspace} />}
    >
      <BusyOverlay
        body="Completing the current workspace action."
        title={workspace.loadingWorkspace ? "Refreshing workspace" : "Applying request"}
        visible={workspace.loadingWorkspace || workspace.actionBusy !== null}
      />

      <section className="space-y-5">
        <DashboardSectionHeader
          description="Manage secrets, vendors, recipient access, team members, and security activity from one workspace."
          title={workspace.title}
        />

        {children}
      </section>

      <DashboardWorkspaceDialogs workspace={workspace} />
      <DashboardWorkspaceConfirmations workspace={workspace} />
    </DashboardShell>
  );
}
