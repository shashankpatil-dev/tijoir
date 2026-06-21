"use client";

import { useEffect } from "react";
import { useDashboardWorkspaceContext } from "@/features/dashboard/components/dashboard-workspace-context";
import { SettingsView } from "@/features/settings/components/settings-view";
import { useSettingsWorkspace } from "@/features/settings/hooks/use-settings-workspace";

export default function DashboardSettingsPage() {
  const shell = useDashboardWorkspaceContext();
  const settings = useSettingsWorkspace({
    handleSessionError: shell.handleSessionError,
    router: shell.router,
    sessionAccessToken: shell.session?.accessToken ?? undefined,
    setActionBusy: shell.setActionBusy,
    setMessage: shell.setMessage,
    showToast: shell.showToast,
  });

  useEffect(
    () => shell.registerRefreshHandler(settings.refreshPolicy),
    [settings.refreshPolicy, shell],
  );

  return (
    <SettingsView
      allowRotationNotifyOnly={settings.allowRotationNotifyOnly}
      allowViewOnce={settings.allowViewOnce}
      allowViewUntilRevoked={settings.allowViewUntilRevoked}
      defaultShareLinkExpiryHours={settings.defaultShareLinkExpiryHours}
      handleUpdatePolicy={settings.handleUpdatePolicy}
      loadingPolicy={settings.loadingPolicy}
      mfa={settings.mfa}
      policyUpdatedAt={settings.policyUpdatedAt}
      requireVendorContractForShareLinks={settings.requireVendorContractForShareLinks}
      rotationReminderDays={settings.rotationReminderDays}
      setAllowRotationNotifyOnly={settings.setAllowRotationNotifyOnly}
      setAllowViewOnce={settings.setAllowViewOnce}
      setAllowViewUntilRevoked={settings.setAllowViewUntilRevoked}
      setDefaultShareLinkExpiryHours={settings.setDefaultShareLinkExpiryHours}
      setRequireVendorContractForShareLinks={settings.setRequireVendorContractForShareLinks}
      setRotationReminderDays={settings.setRotationReminderDays}
    />
  );
}
