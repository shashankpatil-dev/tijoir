"use client";

import { useDashboardWorkspaceContext } from "@/features/dashboard/components/dashboard-workspace-context";
import { SettingsView } from "@/features/settings/components/settings-view";

export default function DashboardSettingsPage() {
  const workspace = useDashboardWorkspaceContext();

  return (
    <SettingsView
      allowRotationNotifyOnly={workspace.allowRotationNotifyOnly}
      allowViewOnce={workspace.allowViewOnce}
      allowViewUntilRevoked={workspace.allowViewUntilRevoked}
      defaultShareLinkExpiryHours={workspace.defaultShareLinkExpiryHours}
      handleUpdatePolicy={workspace.handleUpdatePolicy}
      policyUpdatedAt={workspace.policyUpdatedAt}
      requireVendorContractForShareLinks={workspace.requireVendorContractForShareLinks}
      rotationReminderDays={workspace.rotationReminderDays}
      setAllowRotationNotifyOnly={workspace.setAllowRotationNotifyOnly}
      setAllowViewOnce={workspace.setAllowViewOnce}
      setAllowViewUntilRevoked={workspace.setAllowViewUntilRevoked}
      setDefaultShareLinkExpiryHours={workspace.setDefaultShareLinkExpiryHours}
      setRequireVendorContractForShareLinks={workspace.setRequireVendorContractForShareLinks}
      setRotationReminderDays={workspace.setRotationReminderDays}
    />
  );
}
