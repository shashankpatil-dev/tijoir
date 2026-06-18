"use client";

import { useEffect } from "react";
import { OverviewView } from "@/features/dashboard/components/overview-view";
import { useDashboardWorkspaceContext } from "@/features/dashboard/components/dashboard-workspace-context";
import { useOverviewWorkspace } from "@/features/dashboard/hooks/use-overview-workspace";

export default function DashboardOverviewPage() {
  const shell = useDashboardWorkspaceContext();
  const overview = useOverviewWorkspace({
    handleSessionError: shell.handleSessionError,
    isOrganizationManager: shell.isOrganizationManager,
    session: shell.session,
  });

  useEffect(
    () => shell.registerRefreshHandler(overview.refreshOverview),
    [overview.refreshOverview, shell],
  );

  return (
    <OverviewView
      activeSecret={overview.activeSecret}
      activeShareLinks={overview.activeShareLinks}
      isOrganizationManager={shell.isOrganizationManager}
      lastCreatedShareReady={false}
      loadingWorkspace={overview.loadingOverview}
      memberCount={overview.memberCount}
      organizationName={shell.session?.organization.name || "Organization"}
      onCreateSecret={shell.requestCreateSecret}
      onCreateShareLink={shell.requestCreateShareLink}
      onInviteMember={shell.requestCreateInvite}
      pendingInvites={overview.pendingInvites}
      session={shell.session}
      secretCount={overview.secretCount}
      vendorCount={overview.vendorCount}
    />
  );
}
