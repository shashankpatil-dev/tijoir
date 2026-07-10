"use client";

import { ConfirmDialog } from "@/components/ui/dialog";
import { useDashboardWorkspaceContext } from "@/features/dashboard/components/dashboard-workspace-context";
import { CreateShareLinkDialog } from "@/features/share-links/components/create-share-link-dialog";
import { ShareLinksView } from "@/features/share-links/components/share-links-view";
import { useShareLinksWorkspace } from "@/features/share-links/hooks/use-share-links-workspace";
import { CONTRACT_PERMISSIONS } from "@/features/share-links/types/share-links.types";

export default function DashboardShareLinksPage() {
  const shell = useDashboardWorkspaceContext();
  const share = useShareLinksWorkspace({
    copyText: shell.copyText,
    handleSessionError: shell.handleSessionError,
    router: shell.router,
    sessionAccessToken: shell.session?.accessToken ?? undefined,
    setActionBusy: shell.setActionBusy,
    setMessage: shell.setMessage,
    showToast: shell.showToast,
  });

  return (
    <>
      <ShareLinksView
        contractPermissions={CONTRACT_PERMISSIONS}
        filteredShareLinksLength={share.filteredShareLinksLength}
        loadingWorkspace={share.loadingShareLinks}
        onCopySelectedAppUrl={(value) => void shell.copyText(value, "Recipient URL")}
        onCopySelectedToken={(value) => void shell.copyText(value, "Share token")}
        onCreateShareLink={() => share.setCreateShareOpen(true)}
        onRevokeSelectedShareLink={() => {
          if (share.selectedShareLink) {
            share.setShareRevokeTarget(share.selectedShareLink);
          }
        }}
        paginatedShareLinks={share.paginatedShareLinks}
        selectedShareLink={share.selectedShareLink}
        selectedShareLinkAppUrl={share.selectedShareLinkAppUrl}
        selectedShareLinkId={share.selectedShareLinkId}
        setSelectedShareLinkId={share.setSelectedShareLinkId}
        setSharePage={share.setSharePage}
        setSharePermissionFilter={share.setSharePermissionFilter}
        setShareSearch={share.setShareSearch}
        setShareStatusFilter={share.setShareStatusFilter}
        shareColumns={share.shareColumns}
        shareLinks={share.paginatedShareLinks}
        shareLinksAvailable={share.shareLinksAvailable}
        sharePage={share.sharePage}
        sharePageCount={share.sharePageCount}
        sharePermissionFilter={share.sharePermissionFilter}
        shareSearch={share.shareSearch}
        shareStatusFilter={share.shareStatusFilter}
        shareTotal={share.shareTotal}
      />

      <CreateShareLinkDialog
        activeVendorContracts={share.vendorContractsForShare}
        actionBusy={shell.actionBusy}
        contractPermissions={CONTRACT_PERMISSIONS}
        onClose={() => share.setCreateShareOpen(false)}
        onSubmit={share.handleCreateShareLink}
        open={share.createShareOpen}
        secrets={share.secrets}
        setShareContractId={share.setShareContractId}
        setShareExpiry={share.setShareExpiry}
        setSharePermission={share.setSharePermission}
        setShareRecipientLabel={share.setShareRecipientLabel}
        setShareSecretId={share.setShareSecretId}
        setShareVendorId={share.setShareVendorId}
        shareContractId={share.shareContractId}
        shareExpiry={share.shareExpiry}
        sharePermission={share.sharePermission}
        shareRecipientLabel={share.shareRecipientLabel}
        shareSecretId={share.shareSecretId}
        shareVendorId={share.shareVendorId}
        vendors={share.vendors}
      />

      <ConfirmDialog
        confirmLabel="Revoke link"
        description={
          share.shareRevokeTarget
            ? `Revoke the contract for ${share.shareRevokeTarget.secretKey}. Recipient access through this link should be closed immediately.`
            : ""
        }
        onClose={() => share.setShareRevokeTarget(null)}
        onConfirm={() => {
          if (share.shareRevokeTarget) {
            void share.handleRevokeShareLink(share.shareRevokeTarget.id);
          }
          share.setShareRevokeTarget(null);
        }}
        open={Boolean(share.shareRevokeTarget)}
        title="Revoke share link"
      />
    </>
  );
}
