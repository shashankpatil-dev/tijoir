"use client";

import { EmptyState, PageSection } from "@/components/dashboard/dashboard-shell";
import { SharePreviewItem } from "@/features/dashboard/components/share-preview-item";
import { SurfaceNote } from "@/features/dashboard/components/surface-note";
import type { InvitePreview } from "@/features/dashboard/hooks/workspace.types";

export function OrganizationSidebar({
  copyText,
  lastCreatedInvite,
}: {
  copyText: (value: string, label: string) => Promise<void>;
  lastCreatedInvite: InvitePreview | null;
}) {
  return (
    <div className="space-y-5">
      <PageSection
        description="A development invite package is shown here only when raw invite tokens are exposed. In production, recipients should accept from email."
        title="Latest invite preview"
      >
        {lastCreatedInvite ? (
          <div className="space-y-4">
            <SharePreviewItem
              label="Invite accept URL"
              onCopy={() => void copyText(lastCreatedInvite.appUrl, "Invite URL")}
              value={lastCreatedInvite.appUrl}
            />
            <SharePreviewItem
              label="Invite token"
              onCopy={() => void copyText(lastCreatedInvite.token, "Invite token")}
              value={lastCreatedInvite.token}
            />
          </div>
        ) : (
          <EmptyState
            description="Create an invite to send a member onboarding email. A raw preview appears only in development-style flows."
            title="No invite preview available"
          />
        )}
      </PageSection>

      <PageSection
        description="Shortcuts for owner and admin tasks."
        title="Admin shortcuts"
      >
        <div className="space-y-3">
          <SurfaceNote
            label="Team management"
            value="Use the Members tab to change roles or remove access."
          />
          <SurfaceNote
            label="Policy controls"
            value="Open policy settings to adjust share-link defaults and permission modes."
          />
          <SurfaceNote
            label="Invite handoff"
            value="Use email delivery for recipient onboarding. Share raw invite tokens only in local or test flows."
          />
        </div>
      </PageSection>
    </div>
  );
}
