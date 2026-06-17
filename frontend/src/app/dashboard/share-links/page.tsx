"use client";

import { useDashboardWorkspaceContext } from "@/features/dashboard/components/dashboard-workspace-context";
import { ShareLinksView } from "@/features/share-links/components/share-links-view";
import { CONTRACT_PERMISSIONS } from "@/features/share-links/types/share-links.types";

export default function DashboardShareLinksPage() {
  const workspace = useDashboardWorkspaceContext();

  return (
    <ShareLinksView
      contractPermissions={CONTRACT_PERMISSIONS}
      copyText={workspace.copyText}
      filteredShareLinksLength={workspace.filteredShareLinks.length}
      lastCreatedShare={workspace.lastCreatedShare}
      loadingWorkspace={workspace.loadingWorkspace}
      onCopySelectedAppUrl={(value) => void workspace.copyText(value, "Recipient URL")}
      onCopySelectedToken={(value) => void workspace.copyText(value, "Share token")}
      onCreateShareLink={() => workspace.setCreateShareOpen(true)}
      onRevokeSelectedShareLink={() => {
        if (workspace.selectedShareLink) {
          workspace.setShareRevokeTarget(workspace.selectedShareLink);
        }
      }}
      paginatedShareLinks={workspace.paginatedShareLinks}
      selectedShareLink={workspace.selectedShareLink}
      selectedShareLinkAppUrl={workspace.selectedShareLinkAppUrl}
      selectedShareLinkId={workspace.selectedShareLinkId}
      setSelectedShareLinkId={workspace.setSelectedShareLinkId}
      setSharePage={workspace.setSharePage}
      setSharePermissionFilter={workspace.setSharePermissionFilter}
      setShareSearch={workspace.setShareSearch}
      setShareStatusFilter={workspace.setShareStatusFilter}
      shareColumns={workspace.shareColumns}
      shareLinks={workspace.shareLinks}
      shareLinksAvailable={workspace.shareLinksAvailable}
      sharePage={workspace.sharePage}
      sharePageCount={workspace.sharePageCount}
      sharePermissionFilter={workspace.sharePermissionFilter}
      shareSearch={workspace.shareSearch}
      shareStatusFilter={workspace.shareStatusFilter}
      shareTotal={workspace.shareLinksTotal}
    />
  );
}
