import { Badge, statusTone } from "@/components/ui/badge";
import type { DataTableColumn } from "@/components/ui/data-table";
import { Menu, MenuItem } from "@/components/ui/menu";
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
      sortable: true,
      sortValue: (shareLink) => shareLink.secretName,
      render: (shareLink) => (
        <div className="space-y-1">
          <p className="font-semibold text-(--color-ink-strong)">
            {shareLink.secretName}
          </p>
          <p className="text-xs text-muted">{shareLink.secretKey}</p>
        </div>
      ),
    },
    {
      key: "recipient",
      label: "Recipient / Vendor",
      sortable: true,
      sortValue: (shareLink) => `${shareLink.recipientLabel || ""} ${shareLink.vendorName || ""}`,
      render: (shareLink) => (
        <div className="space-y-1">
          <p>{shareLink.recipientLabel || "Not specified"}</p>
          <p className="text-xs text-muted">
            {shareLink.vendorName || "No vendor linkage"}
          </p>
        </div>
      ),
    },
    {
      key: "permission",
      label: "Permission",
      sortable: true,
      sortValue: (shareLink) => shareLink.permission,
      render: (shareLink) => (
        <Badge tone={statusTone(shareLink.permission)}>{shareLink.permission}</Badge>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      sortValue: (shareLink) => shareLink.status,
      render: (shareLink) => <Badge tone={statusTone(shareLink.status)}>{shareLink.status}</Badge>,
    },
    {
      key: "expiresAt",
      label: "Expiry",
      sortable: true,
      sortValue: (shareLink) => (shareLink.expiresAt ? new Date(shareLink.expiresAt).getTime() : 0),
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
              <span>Copy token</span>
            </MenuItem>
          ) : null}
          <MenuItem onClick={() => onRevoke(shareLink)}>
            <span>Revoke link</span>
          </MenuItem>
        </Menu>
      ),
    },
  ];
}
