"use client";

import { ConfirmDialog } from "@/components/ui/dialog";
import type { DashboardWorkspaceValue } from "@/features/dashboard/components/dashboard-workspace-context";

export function DashboardWorkspaceConfirmations({
  workspace,
}: {
  workspace: DashboardWorkspaceValue;
}) {
  return (
    <>
      <ConfirmDialog
        confirmLabel="Revoke secret"
        description={
          workspace.secretRevokeTarget
            ? `Revoke ${workspace.secretRevokeTarget.secretKey}. This should stop future reveal access for the active vault entry.`
            : ""
        }
        onClose={() => workspace.setSecretRevokeTarget(null)}
        onConfirm={() => {
          if (workspace.secretRevokeTarget) {
            void workspace.handleRevokeSecret(workspace.secretRevokeTarget.id);
          }
          workspace.setSecretRevokeTarget(null);
        }}
        open={Boolean(workspace.secretRevokeTarget)}
        title="Revoke vault secret"
      />

      <ConfirmDialog
        confirmLabel="Revoke link"
        description={
          workspace.shareRevokeTarget
            ? `Revoke the contract for ${workspace.shareRevokeTarget.secretKey}. Recipient access through this link should be closed immediately.`
            : ""
        }
        onClose={() => workspace.setShareRevokeTarget(null)}
        onConfirm={() => {
          if (workspace.shareRevokeTarget) {
            void workspace.handleRevokeShareLink(workspace.shareRevokeTarget.id);
          }
          workspace.setShareRevokeTarget(null);
        }}
        open={Boolean(workspace.shareRevokeTarget)}
        title="Revoke share link"
      />

      <ConfirmDialog
        confirmLabel="Revoke contract"
        description={
          workspace.contractRevokeTarget
            ? `Revoke the contract for ${workspace.contractRevokeTarget.secretKey}. Future vendor-linked access should stop immediately.`
            : ""
        }
        onClose={() => workspace.setContractRevokeTarget(null)}
        onConfirm={() => {
          if (workspace.contractRevokeTarget) {
            void workspace.handleRevokeVendorContract();
          }
          workspace.setContractRevokeTarget(null);
        }}
        open={Boolean(workspace.contractRevokeTarget)}
        title="Revoke vendor contract"
      />

      <ConfirmDialog
        confirmLabel="Offboard vendor"
        description={
          workspace.vendorOffboardTarget
            ? `Offboard ${workspace.vendorOffboardTarget.name}. Active contracts and vendor-linked share links should be revoked.`
            : ""
        }
        onClose={() => workspace.setVendorOffboardTarget(null)}
        onConfirm={() => {
          if (workspace.vendorOffboardTarget) {
            void workspace.handleOffboardVendor();
          }
          workspace.setVendorOffboardTarget(null);
        }}
        open={Boolean(workspace.vendorOffboardTarget)}
        title="Offboard vendor"
      />

      <ConfirmDialog
        confirmLabel="Revoke invite"
        description={
          workspace.inviteRevokeTarget
            ? `Revoke the invite for ${workspace.inviteRevokeTarget.email}. The accept token should stop working immediately.`
            : ""
        }
        onClose={() => workspace.setInviteRevokeTarget(null)}
        onConfirm={() => {
          if (workspace.inviteRevokeTarget) {
            void workspace.handleRevokeInvite(workspace.inviteRevokeTarget.id);
          }
          workspace.setInviteRevokeTarget(null);
        }}
        open={Boolean(workspace.inviteRevokeTarget)}
        title="Revoke invite"
      />

      <ConfirmDialog
        confirmLabel="Remove member"
        description={
          workspace.memberRemoveTarget
            ? `Remove ${workspace.memberRemoveTarget.email} from the organization.`
            : ""
        }
        onClose={() => workspace.setMemberRemoveTarget(null)}
        onConfirm={() => {
          if (workspace.memberRemoveTarget) {
            void workspace.handleRemoveMember(workspace.memberRemoveTarget.id);
          }
          workspace.setMemberRemoveTarget(null);
        }}
        open={Boolean(workspace.memberRemoveTarget)}
        title="Remove member"
      />
    </>
  );
}
