import { Badge, statusTone } from "@/components/ui/badge";
import type { DataTableColumn } from "@/components/ui/data-table";
import { Menu, MenuItem } from "@/components/ui/menu";
import type { AuditEventResponse } from "@/features/audit/types/audit.types";
import { formatInstant } from "@/features/dashboard/lib/dashboard-format";
import type { SecretSummary } from "@/features/secrets/types/secrets.types";
import type {
  VendorContractResponse,
  VendorResponse,
} from "@/features/vendors/types/vendors.types";

export function buildSecretColumns(): DataTableColumn<SecretSummary>[] {
  return [
    {
      key: "name",
      label: "Secret",
      render: (secret) => (
        <div className="space-y-1">
          <p className="font-semibold text-[var(--color-ink-strong)]">
            {secret.name}
          </p>
          <p className="text-xs text-[var(--color-muted)]">{secret.secretKey}</p>
        </div>
      ),
    },
    { key: "type", label: "Type", render: (secret) => secret.type },
    {
      key: "status",
      label: "Status",
      render: (secret) => <Badge tone={statusTone(secret.status)}>{secret.status}</Badge>,
    },
    {
      key: "version",
      label: "Version",
      render: (secret) => `v${secret.currentVersionNumber}`,
    },
    {
      key: "createdAt",
      label: "Created",
      render: (secret) => formatInstant(secret.createdAt),
    },
  ];
}

export function buildVendorColumns(): DataTableColumn<VendorResponse>[] {
  return [
    {
      key: "name",
      label: "Vendor",
      render: (vendor) => (
        <div className="space-y-1">
          <p className="font-semibold text-[var(--color-ink-strong)]">{vendor.name}</p>
          <p className="text-xs text-[var(--color-muted)]">
            {vendor.contactEmail || vendor.contactName || "No contact assigned"}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (vendor) => <Badge tone={statusTone(vendor.status)}>{vendor.status}</Badge>,
    },
    {
      key: "createdBy",
      label: "Created by",
      render: (vendor) => vendor.createdByName,
    },
    {
      key: "createdAt",
      label: "Created",
      render: (vendor) => formatInstant(vendor.createdAt),
    },
  ];
}

export function buildVendorContractColumns({
  onRevoke,
}: {
  onRevoke: (contract: VendorContractResponse) => void;
}): DataTableColumn<VendorContractResponse>[] {
  return [
    {
      key: "secret",
      label: "Secret",
      render: (contract) => (
        <div className="space-y-1">
          <p className="font-semibold text-[var(--color-ink-strong)]">
            {contract.secretName}
          </p>
          <p className="text-xs text-[var(--color-muted)]">{contract.secretKey}</p>
        </div>
      ),
    },
    {
      key: "permission",
      label: "Permission",
      render: (contract) => (
        <Badge tone={statusTone(contract.permission)}>{contract.permission}</Badge>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (contract) => (
        <Badge tone={statusTone(contract.status)}>{contract.status}</Badge>
      ),
    },
    {
      key: "expiresAt",
      label: "Expiry",
      render: (contract) => formatInstant(contract.expiresAt),
    },
    {
      key: "actions",
      label: "Actions",
      render: (contract) => (
        <Menu
          buttonClassName="px-3 py-2 text-xs"
          label={<span aria-label="Contract actions">•••</span>}
        >
          <MenuItem
          onClick={() => {
              if (contract.status === "ACTIVE") {
                onRevoke(contract);
              }
            }}
          >
            <span>Revoke contract</span>
          </MenuItem>
        </Menu>
      ),
    },
  ];
}

export function buildAuditColumns(): DataTableColumn<AuditEventResponse>[] {
  return [
    {
      key: "action",
      label: "Action",
      render: (event) => (
        <div className="space-y-1">
          <p className="font-semibold text-[var(--color-ink-strong)]">{event.action}</p>
          <p className="text-xs text-[var(--color-muted)]">{event.resourceType}</p>
        </div>
      ),
    },
    {
      key: "actor",
      label: "Actor",
      render: (event) => (
        <div className="space-y-1">
          <p>{event.actorName || "System / public flow"}</p>
          <p className="text-xs text-[var(--color-muted)]">
            {event.actorEmail || "Anonymous or internal automation"}
          </p>
        </div>
      ),
    },
    {
      key: "resourceId",
      label: "Resource",
      render: (event) => (
        <span className="font-mono text-xs text-[var(--color-muted)]">{event.resourceId}</span>
      ),
    },
    {
      key: "details",
      label: "Details",
      render: (event) => {
        if (!event.details) {
          return "No details";
        }
        if (typeof event.details === "string") {
          return event.details;
        }
        return (
          <pre className="max-w-[26rem] whitespace-pre-wrap break-words text-xs text-[var(--color-muted)]">
            {JSON.stringify(event.details, null, 2)}
          </pre>
        );
      },
    },
    {
      key: "createdAt",
      label: "At",
      render: (event) => formatInstant(event.createdAt),
    },
  ];
}
