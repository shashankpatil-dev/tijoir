"use client";

import { EmptyState, PageSection } from "@/components/dashboard/dashboard-shell";
import { SharePreviewItem } from "@/features/dashboard/components/share-preview-item";
import { SurfaceNote } from "@/features/dashboard/components/surface-note";
import type { SharePreview } from "@/features/dashboard/hooks/workspace.types";
import type { ShareLinkResponse } from "@/features/share-links/types/share-links.types";

export function ShareLinkSidebar({
  copyText,
  lastCreatedShare,
  selectedShareLink,
}: {
  copyText: (value: string, label: string) => Promise<void>;
  lastCreatedShare: SharePreview | null;
  selectedShareLink: ShareLinkResponse | null;
}) {
  return (
    <div className="space-y-5">
      <PageSection
        description="The newest recipient package is staged here for vendor handoff."
        title="Latest recipient package"
      >
        {lastCreatedShare ? (
          <div className="space-y-4">
            <SharePreviewItem
              label="Recipient app URL"
              onCopy={() => void copyText(lastCreatedShare.appUrl, "Recipient URL")}
              value={lastCreatedShare.appUrl}
            />
            <SharePreviewItem
              label="Share token"
              onCopy={() => void copyText(lastCreatedShare.token, "Share token")}
              value={lastCreatedShare.token}
            />
          </div>
        ) : (
          <EmptyState
            description="Create a share link to populate the recipient package."
            title="No recipient package yet"
          />
        )}
      </PageSection>

      <PageSection
        description="Share links are public recipient contracts. They should be created only after the vault value is ready."
        title="Contract guidance"
      >
        <div className="space-y-3">
          <SurfaceNote
            label="VIEW_ONCE"
            value="Reveal succeeds once, then the link moves to consumed."
          />
          <SurfaceNote
            label="VIEW_UNTIL_REVOKED"
            value="Reveal remains available until the issuer revokes or expiry closes the contract."
          />
          <SurfaceNote
            label="ROTATION_NOTIFY_ONLY"
            value="Metadata can be inspected, but the raw secret should not be revealed."
          />
          <SurfaceNote
            label="Best handoff"
            value="Send the recipient app URL first. Share the token only through a trusted channel."
          />
          <SurfaceNote
            label="Selected context"
            value={
              selectedShareLink
                ? `${selectedShareLink.secretKey} is currently ${selectedShareLink.status.toLowerCase()}.`
                : "Select a share link to review the live recipient contract."
            }
          />
        </div>
      </PageSection>
    </div>
  );
}
