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
        description="The newest invite package is staged here so the owner or admin can hand it to the recipient while email delivery remains out of scope."
        title="Latest invite package"
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
            description="Create an invite to stage the member onboarding URL and token."
            title="No invite package yet"
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
            value="Use the latest invite package to onboard users until email delivery is enabled."
          />
        </div>
      </PageSection>
    </div>
  );
}
