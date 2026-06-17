import { Badge, statusTone } from "@/components/ui/badge";
import type { DataTableColumn } from "@/components/ui/data-table";
import { Menu, MenuHint, MenuItem } from "@/components/ui/menu";
import type { AuditEventResponse } from "@/features/audit/types/audit.types";
import {
  canEditMember,
  canRemoveMember,
} from "@/features/dashboard/lib/dashboard-members";
import { formatInstant } from "@/features/dashboard/lib/dashboard-format";
import type {
  InviteSummary,
  MemberSummary,
} from "@/features/members/types/members.types";
import type { SecretSummary } from "@/features/secrets/types/secrets.types";
import type { ShareLinkResponse } from "@/features/share-links/types/share-links.types";
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
            <MenuHint
              label="Revoke contract"
              text={
                contract.status === "ACTIVE"
                  ? "Disable this active vendor contract."
                  : "Only active contracts can be revoked."
              }
            />
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

export function buildMemberColumns({
  actorEmail,
  actorRole,
  onChangeRole,
  onRemove,
}: {
  actorEmail: string;
  actorRole: string;
  onChangeRole: (member: MemberSummary) => void;
  onRemove: (member: MemberSummary) => void;
}): DataTableColumn<MemberSummary>[] {
  return [
    {
      key: "identity",
      label: "Member",
      render: (member) => (
        <div className="space-y-1">
          <p className="font-semibold text-[var(--color-ink-strong)]">{member.name}</p>
          <p className="text-xs text-[var(--color-muted)]">{member.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (member) => <Badge tone="info">{member.role}</Badge>,
    },
    {
      key: "verified",
      label: "Verified",
      render: (member) => (
        <Badge tone={member.emailVerified ? "success" : "warning"}>
          {member.emailVerified ? "Verified" : "Pending"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Joined",
      render: (member) => formatInstant(member.createdAt),
    },
    {
      key: "actions",
      label: "Actions",
      render: (member) => (
        <Menu
          buttonClassName="px-3 py-2 text-xs"
          label={<span aria-label="Member actions">•••</span>}
        >
          <MenuItem
            onClick={() => {
              if (canEditMember(actorRole, member, actorEmail)) {
                onChangeRole(member);
              }
            }}
          >
            <MenuHint
              label="Change role"
              text={
                canEditMember(actorRole, member, actorEmail)
                  ? "Update this member's organization role."
                  : "Role change is not available for this member."
              }
            />
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (canRemoveMember(actorRole, member, actorEmail)) {
                onRemove(member);
              }
            }}
          >
            <MenuHint
              label="Remove member"
              text={
                canRemoveMember(actorRole, member, actorEmail)
                  ? "Remove this member from the organization."
                  : "Removal is not available for this member."
              }
            />
          </MenuItem>
        </Menu>
      ),
    },
  ];
}

export function buildInviteColumns({
  onRevoke,
}: {
  onRevoke: (invite: InviteSummary) => void;
}): DataTableColumn<InviteSummary>[] {
  return [
    {
      key: "email",
      label: "Invitee",
      render: (invite) => (
        <div className="space-y-1">
          <p className="font-semibold text-[var(--color-ink-strong)]">{invite.email}</p>
          <p className="text-xs text-[var(--color-muted)]">
            Invited by {invite.invitedByName}
          </p>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (invite) => <Badge tone="info">{invite.role}</Badge>,
    },
    {
      key: "status",
      label: "Status",
      render: (invite) => <Badge tone={statusTone(invite.status)}>{invite.status}</Badge>,
    },
    {
      key: "expiresAt",
      label: "Expiry",
      render: (invite) => formatInstant(invite.expiresAt),
    },
    {
      key: "actions",
      label: "Actions",
      render: (invite) => (
        <Menu
          buttonClassName="px-3 py-2 text-xs"
          label={<span aria-label="Invite actions">•••</span>}
        >
          <MenuItem
            onClick={() => {
              if (invite.status === "PENDING") {
                onRevoke(invite);
              }
            }}
          >
            <MenuHint
              label="Revoke invite"
              text={
                invite.status === "PENDING"
                  ? "Cancel this outstanding invitation."
                  : "Only pending invites can be revoked."
              }
            />
          </MenuItem>
        </Menu>
      ),
    },
  ];
}
