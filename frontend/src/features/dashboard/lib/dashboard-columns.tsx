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
      sortable: true,
      sortValue: (secret) => secret.name,
      render: (secret) => (
        <div className="space-y-1">
          <p className="font-semibold text-(--color-ink-strong)">
            {secret.name}
          </p>
          <p className="text-xs text-muted">{secret.secretKey}</p>
        </div>
      ),
    },
    { key: "type", label: "Type", sortable: true, sortValue: (secret) => secret.type, render: (secret) => secret.type },
    {
      key: "status",
      label: "Status",
      sortable: true,
      sortValue: (secret) => secret.status,
      render: (secret) => <Badge tone={statusTone(secret.status)}>{secret.status}</Badge>,
    },
    {
      key: "version",
      label: "Version",
      sortable: true,
      sortValue: (secret) => secret.currentVersionNumber,
      render: (secret) => `v${secret.currentVersionNumber}`,
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      sortValue: (secret) => new Date(secret.createdAt).getTime(),
      render: (secret) => formatInstant(secret.createdAt),
    },
  ];
}

export function buildVendorColumns(): DataTableColumn<VendorResponse>[] {
  return [
    {
      key: "name",
      label: "Vendor",
      sortable: true,
      sortValue: (vendor) => vendor.name,
      render: (vendor) => (
        <div className="space-y-1">
          <p className="font-semibold text-(--color-ink-strong)">{vendor.name}</p>
          <p className="text-xs text-muted">
            {vendor.contactEmail || vendor.contactName || "No contact assigned"}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      sortValue: (vendor) => vendor.status,
      render: (vendor) => <Badge tone={statusTone(vendor.status)}>{vendor.status}</Badge>,
    },
    {
      key: "createdBy",
      label: "Created by",
      sortable: true,
      sortValue: (vendor) => vendor.createdByName,
      render: (vendor) => vendor.createdByName,
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      sortValue: (vendor) => new Date(vendor.createdAt).getTime(),
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
      sortable: true,
      sortValue: (contract) => contract.secretName,
      render: (contract) => (
        <div className="space-y-1">
          <p className="font-semibold text-(--color-ink-strong)">
            {contract.secretName}
          </p>
          <p className="text-xs text-muted">{contract.secretKey}</p>
        </div>
      ),
    },
    {
      key: "permission",
      label: "Permission",
      sortable: true,
      sortValue: (contract) => contract.permission,
      render: (contract) => (
        <Badge tone={statusTone(contract.permission)}>{contract.permission}</Badge>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      sortValue: (contract) => contract.status,
      render: (contract) => (
        <Badge tone={statusTone(contract.status)}>{contract.status}</Badge>
      ),
    },
    {
      key: "expiresAt",
      label: "Expiry",
      sortable: true,
      sortValue: (contract) => (contract.expiresAt ? new Date(contract.expiresAt).getTime() : 0),
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
      sortable: true,
      sortValue: (event) => event.action,
      render: (event) => (
        <div className="space-y-1">
          <p className="font-semibold text-(--color-ink-strong)">{event.action}</p>
          <p className="text-xs text-muted">{event.resourceType}</p>
        </div>
      ),
    },
    {
      key: "actor",
      label: "Actor",
      sortable: true,
      sortValue: (event) => event.actorName || event.actorEmail || "",
      render: (event) => (
        <div className="space-y-1">
          <p>{event.actorName || "System / public flow"}</p>
          <p className="text-xs text-muted">
            {event.actorEmail || "Anonymous or internal automation"}
          </p>
        </div>
      ),
    },
    {
      key: "resourceId",
      label: "Resource",
      sortable: true,
      sortValue: (event) => event.resourceId,
      render: (event) => (
        <span className="font-mono text-xs text-muted">{event.resourceId}</span>
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
          <pre className="max-w-104 whitespace-pre-wrap wrap-break-word text-xs text-muted">
            {JSON.stringify(event.details, null, 2)}
          </pre>
        );
      },
    },
    {
      key: "createdAt",
      label: "At",
      sortable: true,
      sortValue: (event) => new Date(event.createdAt).getTime(),
      render: (event) => formatInstant(event.createdAt),
    },
  ];
}
