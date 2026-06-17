"use client";

import { OverviewView } from "@/features/dashboard/components/overview-view";
import { useDashboardWorkspaceContext } from "@/features/dashboard/components/dashboard-workspace-context";

export default function DashboardOverviewPage() {
  const workspace = useDashboardWorkspaceContext();

  return (
    <OverviewView
      activeSecret={workspace.activeSecret}
      activeShareLinks={workspace.activeShareLinks}
      isOrganizationManager={workspace.isOrganizationManager}
      lastCreatedShareReady={Boolean(workspace.lastCreatedShare)}
      loadingWorkspace={workspace.loadingWorkspace}
      memberCount={workspace.members.length}
      organizationName={workspace.session?.organization.name || "Organization"}
      onCreateSecret={workspace.openCreateSecret}
      onCreateShareLink={workspace.openCreateShareLink}
      onInviteMember={workspace.openCreateInvite}
      pendingInvites={workspace.pendingInvites}
      session={workspace.session}
      secretCount={workspace.secrets.length}
      vendorCount={workspace.vendors.length}
    />
  );
}
