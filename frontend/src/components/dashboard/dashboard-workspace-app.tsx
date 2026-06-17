"use client";

import type { ReactNode } from "react";
import { DashboardSectionHeader, DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { BusyOverlay } from "@/components/ui/feedback";
import { Menu, MenuDivider, MenuHint, MenuItem } from "@/components/ui/menu";
import { ChangeMemberRoleDialog } from "@/features/members/components/change-member-role-dialog";
import { CreateInviteDialog } from "@/features/members/components/create-invite-dialog";
import { CreateSecretDialog } from "@/features/secrets/components/create-secret-dialog";
import { RotateSecretDialog } from "@/features/secrets/components/rotate-secret-dialog";
import { GENERATOR_SUPPORTED_SECRET_TYPES, SECRET_TYPES } from "@/features/secrets/types/secrets.types";
import { CreateShareLinkDialog } from "@/features/share-links/components/create-share-link-dialog";
import { CONTRACT_PERMISSIONS } from "@/features/share-links/types/share-links.types";
import { useDashboardWorkspaceContext } from "@/features/dashboard/components/dashboard-workspace-context";
import { viewPath, type DashboardViewKey } from "@/features/dashboard/lib/dashboard-routing";
import { CreateVendorContractDialog } from "@/features/vendors/components/create-vendor-contract-dialog";
import { CreateVendorDialog } from "@/features/vendors/components/create-vendor-dialog";

export function DashboardWorkspaceApp({ children }: { children: ReactNode }) {
  const workspace = useDashboardWorkspaceContext();

  return (
    <DashboardShell
      activeItemId={workspace.activeView}
      items={workspace.navigationItems}
      onSelect={(value) => workspace.router.push(viewPath(value as DashboardViewKey))}
      topbarActions={
        <>
          <Menu
            label={
              <>
                <span>Create</span>
                <span aria-hidden="true">▾</span>
              </>
            }
          >
            <MenuItem onClick={workspace.openCreateSecret}>
              <MenuHint label="New secret" text="Store a new secret in the vault." />
            </MenuItem>
            <MenuItem onClick={workspace.openCreateShareLink}>
              <MenuHint label="Share access" text="Prepare recipient access for a secret." />
            </MenuItem>
            {workspace.vendorsAvailable ? (
              <MenuItem onClick={workspace.openCreateVendor}>
                <MenuHint label="New vendor" text="Add an external entity before sharing." />
              </MenuItem>
            ) : null}
            {workspace.isOrganizationManager ? (
              <MenuItem onClick={workspace.openCreateInvite}>
                <MenuHint label="Invite member" text="Add another user to the organization." />
              </MenuItem>
            ) : null}
          </Menu>

          <Button onClick={workspace.refreshWorkspace} type="button" variant="secondary">
            {workspace.loadingWorkspace ? "Refreshing..." : "Refresh"}
          </Button>

          <Menu
            label={
              <>
                <span>{workspace.session?.user.name || "Account"}</span>
                <span aria-hidden="true">▾</span>
              </>
            }
          >
            {workspace.isOrganizationManager ? (
              <MenuItem onClick={() => workspace.router.push("/dashboard/organization")}>
                <MenuHint label="Organization" text="Open team and access administration." />
              </MenuItem>
            ) : null}
            {workspace.isOrganizationManager ? (
              <MenuItem onClick={() => workspace.router.push("/dashboard/settings")}>
                <MenuHint label="Settings" text="Review organization policy controls." />
              </MenuItem>
            ) : null}
            <MenuDivider />
            <MenuItem onClick={workspace.logout}>
              <MenuHint label="Logout" text="End the current workspace session." />
            </MenuItem>
          </Menu>
        </>
      }
      userMeta={
        workspace.session ? (
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold text-[var(--color-ink-strong)]">
                {workspace.session.organization.name}
              </h1>
              <Badge tone="info">{workspace.session.user.role}</Badge>
              <Badge tone={workspace.session.user.emailVerified ? "success" : "warning"}>
                {workspace.session.user.emailVerified ? "Verified" : "Unverified"}
              </Badge>
            </div>
            <p className="text-sm text-[var(--color-muted)]">
              {workspace.session.user.name} · {workspace.session.user.email}
            </p>
          </div>
        ) : null
      }
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
    </DashboardShell>
  );
}
