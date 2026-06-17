"use client";

import {
  DetailList,
  EmptyState,
  PageSection,
} from "@/components/dashboard/dashboard-shell";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatInstant } from "@/features/dashboard/lib/dashboard-format";
import type { ShareLinkResponse } from "@/features/share-links/types/share-links.types";

export function SelectedShareLinkSection({
  onCopySelectedAppUrl,
  onCopySelectedToken,
  onRevokeSelectedShareLink,
  selectedShareLink,
  selectedShareLinkAppUrl,
}: {
  onCopySelectedAppUrl: (value: string) => void;
  onCopySelectedToken: (value: string) => void;
  onRevokeSelectedShareLink: () => void;
  selectedShareLink: ShareLinkResponse | null;
  selectedShareLinkAppUrl: string | null;
}) {
  return (
    <PageSection
      description="Inspect the selected recipient contract before copying, handing off, or revoking it."
      title="Selected share link"
    >
      {selectedShareLink ? (
        <div className="space-y-5">
          <DetailList
            items={[
              { label: "Secret", value: selectedShareLink.secretName },
              { label: "Secret key", value: selectedShareLink.secretKey },
              { label: "Type", value: selectedShareLink.secretType },
              {
                label: "Permission",
                value: (
                  <Badge tone={statusTone(selectedShareLink.permission)}>
                    {selectedShareLink.permission}
                  </Badge>
                ),
              },
              {
                label: "Status",
                value: (
                  <Badge tone={statusTone(selectedShareLink.status)}>
                    {selectedShareLink.status}
                  </Badge>
                ),
              },
              {
                label: "Recipient",
                value: selectedShareLink.recipientLabel || "Not specified",
              },
              {
                label: "Vendor",
                value: selectedShareLink.vendorName || "No linked vendor",
              },
              {
                label: "Created",
                value: formatInstant(selectedShareLink.createdAt),
              },
              {
                label: "Expires",
                value: formatInstant(selectedShareLink.expiresAt),
              },
              {
                label: "Consumed at",
                value: formatInstant(selectedShareLink.consumedAt),
              },
            ]}
          />

          <div className="flex flex-wrap gap-3">
            {selectedShareLink.shareToken ? (
              <Button
                onClick={() => onCopySelectedToken(selectedShareLink.shareToken || "")}
                type="button"
                variant="secondary"
              >
                Copy token
              </Button>
            ) : null}
            {selectedShareLinkAppUrl ? (
              <Button
                onClick={() => onCopySelectedAppUrl(selectedShareLinkAppUrl)}
                type="button"
                variant="secondary"
              >
                Copy recipient URL
              </Button>
            ) : null}
            <Button
              disabled={selectedShareLink.status !== "ACTIVE"}
              onClick={onRevokeSelectedShareLink}
              type="button"
              variant="outline"
            >
              Revoke link
            </Button>
          </div>
        </div>
      ) : (
        <EmptyState
          description="Select a share-link row to inspect the recipient contract and handoff state."
          title="No share link selected"
        />
      )}
    </PageSection>
  );
}
