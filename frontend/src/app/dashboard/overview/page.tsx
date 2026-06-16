"use client";

import { OverviewView } from "@/features/dashboard/components/overview-view";
import { useDashboardWorkspaceContext } from "@/features/dashboard/components/dashboard-workspace-context";

export default function DashboardOverviewPage() {
  const workspace = useDashboardWorkspaceContext();

  return (
    <OverviewView
      activeSecret={workspace.activeSecret}
      isOrganizationManager={workspace.isOrganizationManager}
      lastCreatedShareReady={Boolean(workspace.lastCreatedShare)}
      memberCount={workspace.members.length}
      onCreateSecret={workspace.openCreateSecret}
      onCreateShareLink={workspace.openCreateShareLink}
      onInviteMember={workspace.openCreateInvite}
      pendingInvites={workspace.pendingInvites}
      session={workspace.session}
    />
  );
}
