"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Menu, MenuDivider, MenuItem } from "@/components/ui/menu";
import type { DashboardWorkspaceValue } from "@/features/dashboard/components/dashboard-workspace-context";

export function DashboardWorkspaceTopbarActions({
  workspace,
}: {
  workspace: DashboardWorkspaceValue;
}) {
  return (
    <>
      <Menu
        label={
          <>
            <span>Create</span>
            <span aria-hidden="true">▾</span>
          </>
        }
      >
        {workspace.canManageSecrets ? (
          <MenuItem onClick={() => workspace.router.push("/dashboard/vault")}>
            <span>New secret</span>
          </MenuItem>
        ) : null}
        {workspace.canManageShareLinks ? (
          <MenuItem onClick={() => workspace.router.push("/dashboard/share-links")}>
            <span>New share link</span>
          </MenuItem>
        ) : null}
        {workspace.canManageVendors ? (
          <MenuItem onClick={() => workspace.router.push("/dashboard/vendors")}>
            <span>New vendor</span>
          </MenuItem>
        ) : null}
        {workspace.canManageOrganization ? (
          <MenuItem onClick={() => workspace.router.push("/dashboard/organization")}>
            <span>Invite member</span>
          </MenuItem>
        ) : null}
      </Menu>

      <Button
        onClick={() => workspace.router.push("/dashboard/notifications")}
        type="button"
        variant="secondary"
      >
        Inbox
      </Button>

      <Menu
        label={
          <>
            <span className="flex flex-col items-start leading-tight">
              <span className="text-sm font-semibold text-[var(--color-ink-strong)]">
                {workspace.session?.organization.name || "Workspace"}
              </span>
              <span className="text-xs text-[var(--color-muted)]">
                {workspace.session?.user.name || "Account"}
              </span>
            </span>
            <span aria-hidden="true">▾</span>
          </>
        }
      >
        {workspace.isOrganizationManager ? (
          <MenuItem onClick={() => workspace.router.push("/dashboard/organization")}>
            <span>Organization</span>
          </MenuItem>
        ) : null}
        {workspace.isOrganizationManager ? (
          <MenuItem onClick={() => workspace.router.push("/dashboard/settings")}>
            <span>Policy</span>
          </MenuItem>
        ) : null}
        {workspace.canReviewAudit ? (
          <MenuItem onClick={() => workspace.router.push("/dashboard/audit")}>
            <span>Audit log</span>
          </MenuItem>
        ) : null}
        <MenuDivider />
        <MenuItem onClick={workspace.logout}>
          <span>Logout</span>
        </MenuItem>
      </Menu>
    </>
  );
}

export function DashboardWorkspaceUserMeta({
  workspace,
}: {
  workspace: DashboardWorkspaceValue;
}) {
  if (!workspace.session) {
    return null;
  }

  return (
    <div className="hidden items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 lg:flex">
      <Badge tone="info">{workspace.session.user.role}</Badge>
      <Badge tone={workspace.session.user.emailVerified ? "success" : "warning"}>
        {workspace.session.user.emailVerified ? "Verified" : "Unverified"}
      </Badge>
      <p className="text-sm text-[var(--color-muted)]">
        {workspace.session.user.name} · {workspace.session.user.email}
      </p>
    </div>
  );
}
