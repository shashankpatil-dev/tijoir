import { Badge, statusTone } from "@/components/ui/badge";
import type { DataTableColumn } from "@/components/ui/data-table";
import { Menu, MenuItem } from "@/components/ui/menu";
import type { AuditEventResponse } from "@/features/audit/types/audit.types";
import { formatInstant } from "@/features/dashboard/lib/dashboard-format";
import type { SecretSummary } from "@/features/secrets/types/secrets.types";
import type {
  IncomingVendorContractResponse,
  VendorContractResponse,
  VendorContractGrantResponse,
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
            {vendor.linkedOrganizationName
              ? `Linked to ${vendor.linkedOrganizationName}`
              : vendor.contactEmail || vendor.contactName || "No contact assigned"}
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
      key: "boundary",
      label: "Contract",
      sortable: true,
      sortValue: (contract) => `${contract.vendorName}-${contract.permission}`,
      render: (contract) => (
        <div className="space-y-1">
          <p className="font-semibold text-(--color-ink-strong)">
            {contract.permission}
          </p>
          <p className="text-xs text-muted">Vendor boundary</p>
        </div>
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
      key: "grantCount",
      label: "Grants",
      sortable: true,
      sortValue: (contract) => contract.grantCount,
      render: (contract) => contract.grantCount,
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
              if (contract.status === "ACTIVE" || contract.status === "PROPOSED") {
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

export function buildIncomingVendorContractColumns({
  onAccept,
  onReject,
}: {
  onAccept: (contract: IncomingVendorContractResponse) => void;
  onReject: (contract: IncomingVendorContractResponse) => void;
}): DataTableColumn<IncomingVendorContractResponse>[] {
  return [
    {
      key: "ownerOrganization",
      label: "From organization",
      sortable: true,
      sortValue: (contract) => contract.ownerOrganizationName,
      render: (contract) => (
        <div className="space-y-1">
          <p className="font-semibold text-(--color-ink-strong)">
            {contract.ownerOrganizationName}
          </p>
          <p className="text-xs text-muted">{contract.ownerOrganizationSlug}</p>
        </div>
      ),
    },
    {
      key: "vendorName",
      label: "Vendor record",
      sortable: true,
      sortValue: (contract) => contract.vendorName,
      render: (contract) => contract.vendorName,
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
          label={<span aria-label="Incoming contract actions">•••</span>}
        >
          <MenuItem
            disabled={contract.status !== "PROPOSED"}
            onClick={() => onAccept(contract)}
          >
            <span>Accept proposal</span>
          </MenuItem>
          <MenuItem
            disabled={contract.status !== "PROPOSED"}
            onClick={() => onReject(contract)}
          >
            <span>Reject proposal</span>
          </MenuItem>
        </Menu>
      ),
    },
  ];
}

export function buildVendorGrantColumns({
  onRevoke,
}: {
  onRevoke?: (grant: VendorContractGrantResponse) => void;
}): DataTableColumn<VendorContractGrantResponse>[] {
  const columns: DataTableColumn<VendorContractGrantResponse>[] = [
    {
      key: "secret",
      label: "Secret",
      sortable: true,
      sortValue: (grant) => grant.secretName,
      render: (grant) => (
        <div className="space-y-1">
          <p className="font-semibold text-(--color-ink-strong)">
            {grant.secretName}
          </p>
          <p className="text-xs text-muted">{grant.secretKey}</p>
        </div>
      ),
    },
    {
      key: "permission",
      label: "Permission",
      sortable: true,
      sortValue: (grant) => grant.permission,
      render: (grant) => (
        <Badge tone={statusTone(grant.permission)}>{grant.permission}</Badge>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      sortValue: (grant) => grant.status,
      render: (grant) => (
        <Badge tone={statusTone(grant.status)}>{grant.status}</Badge>
      ),
    },
    {
      key: "expiresAt",
      label: "Expiry",
      sortable: true,
      sortValue: (grant) => (grant.expiresAt ? new Date(grant.expiresAt).getTime() : 0),
      render: (grant) => formatInstant(grant.expiresAt),
    },
  ];

  if (onRevoke) {
    columns.push({
      key: "actions",
      label: "Actions",
      render: (grant) => (
        <Menu
          buttonClassName="px-3 py-2 text-xs"
          label={<span aria-label="Grant actions">•••</span>}
        >
          <MenuItem
            onClick={() => {
              if (grant.status === "ACTIVE") {
                onRevoke(grant);
              }
            }}
          >
            <span>Revoke grant</span>
          </MenuItem>
        </Menu>
      ),
    });
  }

  return columns;
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
