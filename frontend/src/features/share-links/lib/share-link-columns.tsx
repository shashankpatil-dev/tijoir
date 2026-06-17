import { Badge, statusTone } from "@/components/ui/badge";
import type { DataTableColumn } from "@/components/ui/data-table";
import { Menu, MenuHint, MenuItem } from "@/components/ui/menu";
import { formatInstant } from "@/features/dashboard/lib/dashboard-format";
import type { ShareLinkResponse } from "@/features/share-links/types/share-links.types";

export function buildShareColumns({
  copyText,
  onRevoke,
}: {
  copyText: (value: string, label: string) => Promise<void>;
  onRevoke: (shareLink: ShareLinkResponse) => void;
}): DataTableColumn<ShareLinkResponse>[] {
  return [
    {
      key: "secret",
      label: "Secret",
      render: (shareLink) => (
        <div className="space-y-1">
          <p className="font-semibold text-[var(--color-ink-strong)]">
            {shareLink.secretName}
          </p>
          <p className="text-xs text-[var(--color-muted)]">{shareLink.secretKey}</p>
        </div>
      ),
    },
    {
      key: "recipient",
      label: "Recipient / Vendor",
      render: (shareLink) => (
        <div className="space-y-1">
          <p>{shareLink.recipientLabel || "Not specified"}</p>
          <p className="text-xs text-[var(--color-muted)]">
            {shareLink.vendorName || "No vendor linkage"}
          </p>
        </div>
      ),
    },
    {
      key: "permission",
      label: "Permission",
      render: (shareLink) => (
        <Badge tone={statusTone(shareLink.permission)}>{shareLink.permission}</Badge>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (shareLink) => <Badge tone={statusTone(shareLink.status)}>{shareLink.status}</Badge>,
    },
    {
      key: "expiresAt",
      label: "Expiry",
      render: (shareLink) => formatInstant(shareLink.expiresAt),
    },
    {
      key: "actions",
      label: "Actions",
      render: (shareLink) => (
        <Menu
          buttonClassName="px-3 py-2 text-xs"
          label={<span aria-label="Share link actions">•••</span>}
        >
          {shareLink.shareToken ? (
            <MenuItem
              onClick={() => {
                void copyText(shareLink.shareToken || "", "Share token");
              }}
            >
              <MenuHint label="Copy token" text="Copy the recipient token." />
            </MenuItem>
          ) : null}
          <MenuItem onClick={() => onRevoke(shareLink)}>
            <MenuHint label="Revoke link" text="Disable this recipient access link." />
          </MenuItem>
        </Menu>
      ),
    },
  ];
}
