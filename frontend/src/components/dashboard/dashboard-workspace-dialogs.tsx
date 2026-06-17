"use client";

import { ChangeMemberRoleDialog } from "@/features/members/components/change-member-role-dialog";
import { CreateInviteDialog } from "@/features/members/components/create-invite-dialog";
import { CreateSecretDialog } from "@/features/secrets/components/create-secret-dialog";
import { RotateSecretDialog } from "@/features/secrets/components/rotate-secret-dialog";
import {
  GENERATOR_SUPPORTED_SECRET_TYPES,
  SECRET_TYPES,
} from "@/features/secrets/types/secrets.types";
import { CreateShareLinkDialog } from "@/features/share-links/components/create-share-link-dialog";
import { CONTRACT_PERMISSIONS } from "@/features/share-links/types/share-links.types";
import { CreateVendorContractDialog } from "@/features/vendors/components/create-vendor-contract-dialog";
import { CreateVendorDialog } from "@/features/vendors/components/create-vendor-dialog";
import type { DashboardWorkspaceValue } from "@/features/dashboard/components/dashboard-workspace-context";

export function DashboardWorkspaceDialogs({
  workspace,
}: {
  workspace: DashboardWorkspaceValue;
}) {
  return (
    <>
      <CreateSecretDialog
        actionBusy={workspace.actionBusy}
        createDescription={workspace.createDescription}
        createName={workspace.createName}
        createType={workspace.createType}
        createValue={workspace.createValue}
        generateLength={workspace.generateLength}
        generatorEnabled={GENERATOR_SUPPORTED_SECRET_TYPES.has(workspace.createType)}
        onClose={() => workspace.setCreateSecretOpen(false)}
        onGenerate={() => void workspace.handleGenerateSecret()}
        onSubmit={workspace.handleCreateSecret}
        open={workspace.createSecretOpen}
        secretTypes={SECRET_TYPES}
        setCreateDescription={workspace.setCreateDescription}
        setCreateName={workspace.setCreateName}
        setCreateType={workspace.setCreateType}
        setCreateValue={workspace.setCreateValue}
        setGenerateLength={workspace.setGenerateLength}
      />

      <RotateSecretDialog
        actionBusy={workspace.actionBusy}
        onClose={() => workspace.setRotateDialogOpen(false)}
        onSubmit={workspace.handleRotateSecret}
        open={workspace.rotateDialogOpen}
        rotateValue={workspace.rotateValue}
        setRotateValue={workspace.setRotateValue}
      />

      <CreateShareLinkDialog
        activeVendorContracts={workspace.vendorContractsForShare}
        actionBusy={workspace.actionBusy}
        contractPermissions={CONTRACT_PERMISSIONS}
        onClose={() => workspace.setCreateShareOpen(false)}
        onSubmit={workspace.handleCreateShareLink}
        open={workspace.createShareOpen}
        secrets={workspace.secrets}
        setShareContractId={workspace.setShareContractId}
        setShareExpiry={workspace.setShareExpiry}
        setSharePermission={workspace.setSharePermission}
        setShareRecipientLabel={workspace.setShareRecipientLabel}
        setShareSecretId={workspace.setShareSecretId}
        setShareVendorId={workspace.setShareVendorId}
        shareContractId={workspace.shareContractId}
        shareExpiry={workspace.shareExpiry}
        sharePermission={workspace.sharePermission}
        shareRecipientLabel={workspace.shareRecipientLabel}
        shareSecretId={workspace.shareSecretId}
        shareVendorId={workspace.shareVendorId}
        vendors={workspace.vendors}
      />

      <CreateVendorDialog
        actionBusy={workspace.actionBusy}
        contactEmail={workspace.vendorContactEmail}
        contactName={workspace.vendorContactName}
        name={workspace.vendorName}
        notes={workspace.vendorNotes}
        onClose={() => workspace.setCreateVendorOpen(false)}
        onSubmit={workspace.handleCreateVendor}
        open={workspace.createVendorOpen}
        setContactEmail={workspace.setVendorContactEmail}
        setContactName={workspace.setVendorContactName}
        setName={workspace.setVendorName}
        setNotes={workspace.setVendorNotes}
      />

      <CreateVendorContractDialog
        actionBusy={workspace.actionBusy}
        contractExpiry={workspace.contractExpiry}
        contractPermission={workspace.contractPermission}
        contractPermissions={CONTRACT_PERMISSIONS}
        contractSecretId={workspace.contractSecretId}
        onClose={() => workspace.setCreateContractOpen(false)}
        onSubmit={workspace.handleCreateVendorContract}
        open={workspace.createContractOpen}
        secrets={workspace.secrets}
        selectedVendor={workspace.selectedVendor}
        setContractExpiry={workspace.setContractExpiry}
        setContractPermission={workspace.setContractPermission}
        setContractSecretId={workspace.setContractSecretId}
      />

      <CreateInviteDialog
        actionBusy={workspace.actionBusy}
        assignableRoles={workspace.assignableRoles}
        inviteEmail={workspace.inviteEmail}
        inviteRole={workspace.inviteRole}
        onClose={() => workspace.setCreateInviteOpen(false)}
        onSubmit={workspace.handleCreateInvite}
        open={workspace.createInviteOpen}
        setInviteEmail={workspace.setInviteEmail}
        setInviteRole={workspace.setInviteRole}
      />

      <ChangeMemberRoleDialog
        actionBusy={workspace.actionBusy}
        assignableRoles={workspace.assignableRoles}
        memberRoleValue={workspace.memberRoleValue}
        onClose={() => workspace.setMemberRoleDialogOpen(false)}
        onSubmit={workspace.handleUpdateMemberRole}
        open={workspace.memberRoleDialogOpen}
        selectedMember={workspace.selectedMember}
        setMemberRoleValue={workspace.setMemberRoleValue}
      />
    </>
  );
}
