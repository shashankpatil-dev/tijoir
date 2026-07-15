"use client";

import { useDashboardWorkspaceContext } from "@/features/dashboard/components/dashboard-workspace-context";
import { AccountSettings } from "@/features/settings/components/account-settings";
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

  return (
    <div className="space-y-5">
      {shell.session && shell.session.accessToken ? (
        <AccountSettings
          accessToken={shell.session.accessToken}
          currentName={shell.session.user.name}
          email={shell.session.user.email}
          isManager={shell.isOrganizationManager}
          organizationName={shell.session.organization.name}
          role={shell.session.user.role}
          showToast={shell.showToast}
        />
      ) : null}
      <SettingsView
      allowRotationNotifyOnly={settings.allowRotationNotifyOnly}
      allowViewOnce={settings.allowViewOnce}
      allowViewUntilRevoked={settings.allowViewUntilRevoked}
      defaultShareLinkExpiryHours={settings.defaultShareLinkExpiryHours}
      handleUpdatePolicy={settings.handleUpdatePolicy}
      loadingPolicy={settings.loadingPolicy}
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
    </div>
  );
}
