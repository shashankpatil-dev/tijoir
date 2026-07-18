"use client";

import { DefinitionRows } from "@/components/dashboard/dashboard-shell";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatInstant } from "@/features/dashboard/lib/dashboard-format";
import type { ShareLinkResponse } from "@/features/share-links/types/share-links.types";
import { Link2 } from "lucide-react";

function expiryProgress(createdAt: string, expiresAt?: string | null) {
  if (!expiresAt) {
    return null;
  }
  const created = new Date(createdAt).getTime();
  const expires = new Date(expiresAt).getTime();
  const now = Date.now();
  if (!Number.isFinite(created) || !Number.isFinite(expires) || expires <= created) {
    return null;
  }
  const pct = Math.min(100, Math.max(0, ((now - created) / (expires - created)) * 100));
  return { pct, expired: now >= expires };
}

export function SelectedShareLinkSection({
  justCreated,
  onCopySelectedAppUrl,
  onCopySelectedToken,
  onRevokeSelectedShareLink,
  selectedShareLink,
}: {
  justCreated: { token: string; appUrl: string } | null;
  onCopySelectedAppUrl: (value: string) => void;
  onCopySelectedToken: (value: string) => void;
  onRevokeSelectedShareLink: () => void;
  selectedShareLink: ShareLinkResponse;
}) {
  const isActive = selectedShareLink.status === "ACTIVE";
  const isOneTime = selectedShareLink.permission === "VIEW_ONCE";
  const consumed = Boolean(selectedShareLink.consumedAt);
  const progress = expiryProgress(
    selectedShareLink.createdAt,
    selectedShareLink.expiresAt,
  );
  const barColor = progress?.expired
    ? "bg-rose-500"
    : progress && progress.pct > 75
      ? "bg-amber-500"
      : "bg-[var(--color-brand)]";

  return (
    <div className="space-y-5">
      {justCreated ? (
        <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div>
            <p className="text-sm font-semibold text-emerald-900">
              Link ready — copy it now
            </p>
            <p className="text-xs leading-5 text-emerald-800">
              The full link and token are shown only once, right after creation.
              You will not be able to see them again — copy now or recreate the
              link later.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-emerald-200 bg-white text-emerald-700">
              <Link2 className="size-8" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="break-all font-mono text-xs text-[var(--color-ink-strong)]">
                {justCreated.appUrl}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => onCopySelectedAppUrl(justCreated.appUrl)}
                  size="sm"
                  type="button"
                >
                  Copy link
                </Button>
                <Button
                  onClick={() => onCopySelectedToken(justCreated.token)}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  Copy token
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--color-border)] bg-(--color-surface) p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
            Recipient link
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            The shareable link is shown only once, when the link is created, and
            cannot be retrieved afterward. To hand it out again, revoke this link
            and create a new one.
          </p>
        </div>
      )}

      <div className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-(--color-surface) p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
            Access status
          </p>
          <Badge tone={statusTone(selectedShareLink.status)}>
            {selectedShareLink.status}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-ink)]">
          <Badge tone={statusTone(selectedShareLink.permission)}>
            {selectedShareLink.permission}
          </Badge>
          {isOneTime ? (
            <span className="text-[var(--color-muted)]">
              {consumed ? "Opened once — spent" : "One-time — not opened yet"}
            </span>
          ) : (
            <span className="text-[var(--color-muted)]">
              {consumed
                ? `First opened ${formatInstant(selectedShareLink.consumedAt)}`
                : "Not opened yet"}
            </span>
          )}
        </div>
        {progress ? (
          <div className="space-y-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
              <div
                className={`h-full rounded-full ${barColor}`}
                style={{ width: `${progress.pct}%` }}
              />
            </div>
            <p className="text-xs text-[var(--color-muted)]">
              {progress.expired
                ? `Expired ${formatInstant(selectedShareLink.expiresAt)}`
                : `Expires ${formatInstant(selectedShareLink.expiresAt)}`}
            </p>
          </div>
        ) : (
          <p className="text-xs text-[var(--color-muted)]">No expiry set</p>
        )}
      </div>

      <DefinitionRows
        items={[
          { label: "Secret", value: selectedShareLink.secretName },
          { label: "Secret key", value: selectedShareLink.secretKey },
          { label: "Type", value: selectedShareLink.secretType },
          {
            label: "Recipient",
            value: selectedShareLink.recipientLabel || "Not specified",
          },
          {
            label: "Vendor",
            value: selectedShareLink.vendorName || "No linked vendor",
          },
          { label: "Created", value: formatInstant(selectedShareLink.createdAt) },
        ]}
      />

      <Button
        disabled={!isActive}
        onClick={onRevokeSelectedShareLink}
        type="button"
        variant="outline"
      >
        Revoke link
      </Button>
    </div>
  );
}
