"use client";

import { DefinitionRows } from "@/components/dashboard/dashboard-shell";
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
  selectedShareLink: ShareLinkResponse;
  selectedShareLinkAppUrl: string | null;
}) {
  return (
    <div className="space-y-5">
      {selectedShareLinkAppUrl ? (
        <div className="space-y-2 rounded-2xl border border-[var(--color-border)] bg-(--color-surface) p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
            Recipient link
          </p>
          <p className="break-all font-mono text-sm text-[var(--color-ink-strong)]">
            {selectedShareLinkAppUrl}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              onClick={() => onCopySelectedAppUrl(selectedShareLinkAppUrl)}
              size="sm"
              type="button"
            >
              Copy link
            </Button>
            {selectedShareLink.shareToken ? (
              <Button
                onClick={() => onCopySelectedToken(selectedShareLink.shareToken || "")}
                size="sm"
                type="button"
                variant="secondary"
              >
                Copy token
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <DefinitionRows
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
          { label: "Created", value: formatInstant(selectedShareLink.createdAt) },
          { label: "Expires", value: formatInstant(selectedShareLink.expiresAt) },
          { label: "Consumed at", value: formatInstant(selectedShareLink.consumedAt) },
        ]}
      />

      <Button
        disabled={selectedShareLink.status !== "ACTIVE"}
        onClick={onRevokeSelectedShareLink}
        type="button"
        variant="outline"
      >
        Revoke link
      </Button>
    </div>
  );
}
