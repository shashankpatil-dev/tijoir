import { useAuditWorkspace } from "@/features/audit/hooks/use-audit-workspace";
import { useMemo } from "react";
import { titleForView } from "@/features/dashboard/lib/dashboard-routing";
import type { DashboardHookArgs } from "@/features/dashboard/hooks/workspace.types";
import { useWorkspaceCore } from "@/features/dashboard/hooks/use-workspace-core";
import { useMembersWorkspace } from "@/features/members/hooks/use-members-workspace";
import { useRecipientWorkspace } from "@/features/recipient-access/hooks/use-recipient-workspace";
import { useVaultWorkspace } from "@/features/secrets/hooks/use-vault-workspace";
import { useShareLinksWorkspace } from "@/features/share-links/hooks/use-share-links-workspace";
import { useSettingsWorkspace } from "@/features/settings/hooks/use-settings-workspace";
import { useVendorsWorkspace } from "@/features/vendors/hooks/use-vendors-workspace";

export function useDashboardWorkspace(args: DashboardHookArgs) {
  const core = useWorkspaceCore(args);

  const recipient = useRecipientWorkspace({
    handleSessionError: core.handleSessionError,
    setActionBusy: core.setActionBusy,
    setMessage: core.setMessage,
    showToast: args.showToast,
  });

  const vault = useVaultWorkspace({
    handleSessionError: core.handleSessionError,
    router: args.router,
    secrets: core.secrets,
    selectedSecretId: core.selectedSecretId,
    sessionAccessToken: core.session?.accessToken,
    setActionBusy: core.setActionBusy,
    setMessage: core.setMessage,
    setSelectedSecretId: core.setSelectedSecretId,
    showToast: args.showToast,
  });

  const vendors = useVendorsWorkspace({
    handleSessionError: core.handleSessionError,
    router: args.router,
    secrets: core.secrets,
    sessionAccessToken: core.session?.accessToken,
    setActionBusy: core.setActionBusy,
    setMessage: core.setMessage,
    showToast: args.showToast,
    vendors: core.vendors,
  });

  const audit = useAuditWorkspace({
    handleSessionError: core.handleSessionError,
    router: args.router,
    sessionAccessToken: core.session?.accessToken,
    setActionBusy: core.setActionBusy,
    setMessage: core.setMessage,
    showToast: args.showToast,
  });

  const shareLinks = useShareLinksWorkspace({
    copyText: core.copyText,
    handleSessionError: core.handleSessionError,
    loadWorkspace: core.loadWorkspace,
    router: args.router,
    secrets: core.secrets,
    sessionAccessToken: core.session?.accessToken,
    setActionBusy: core.setActionBusy,
    setMessage: core.setMessage,
    setPublicToken: recipient.setPublicToken,
    shareLinks: core.shareLinks,
    showToast: args.showToast,
    vendors: core.vendors,
  });

  const members = useMembersWorkspace({
    handleSessionError: core.handleSessionError,
    invites: core.invites,
    loadWorkspace: core.loadWorkspace,
    members: core.members,
    router: args.router,
    sessionAccessToken: core.session?.accessToken,
    sessionUserEmail: core.session?.user.email,
    sessionUserRole: core.session?.user.role,
    setActionBusy: core.setActionBusy,
    setMessage: core.setMessage,
    showToast: args.showToast,
  });

  const settings = useSettingsWorkspace({
    handleSessionError: core.handleSessionError,
    router: args.router,
    sessionAccessToken: core.session?.accessToken,
    setActionBusy: core.setActionBusy,
    setMessage: core.setMessage,
    showToast: args.showToast,
  });

  const title = useMemo(() => titleForView(core.activeView), [core.activeView]);

  return {
    ...core,
    ...audit,
    ...vault,
    ...vendors,
    ...shareLinks,
    ...members,
    ...settings,
    ...recipient,
    router: args.router,
    title,
  };
}
