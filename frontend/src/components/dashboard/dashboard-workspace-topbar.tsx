"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Menu, MenuDivider, MenuHint, MenuItem } from "@/components/ui/menu";
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
        {workspace.showCreateSecret ? (
          <MenuItem onClick={workspace.requestCreateSecret}>
            <MenuHint label="New secret" text="Store a new secret in the vault." />
          </MenuItem>
        ) : null}
        {workspace.showCreateShareLink ? (
          <MenuItem onClick={workspace.requestCreateShareLink}>
            <MenuHint label="Share access" text="Prepare recipient access for a secret." />
          </MenuItem>
        ) : null}
        {workspace.showCreateVendor ? (
          <MenuItem onClick={workspace.requestCreateVendor}>
            <MenuHint label="New vendor" text="Add an external entity before sharing." />
          </MenuItem>
        ) : null}
        {workspace.showCreateInvite ? (
          <MenuItem onClick={workspace.requestCreateInvite}>
            <MenuHint label="Invite member" text="Add another user to the organization." />
          </MenuItem>
        ) : null}
      </Menu>

      <Button onClick={() => void workspace.refreshCurrentView()} type="button" variant="secondary">
        {workspace.isRefreshingView ? "Refreshing..." : "Refresh"}
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
  );
}
