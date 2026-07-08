import { Badge, statusTone } from "@/components/ui/badge";
import type { DataTableColumn } from "@/components/ui/data-table";
import { Menu, MenuHint, MenuItem } from "@/components/ui/menu";
import {
  canEditMember,
  canRemoveMember,
} from "@/features/dashboard/lib/dashboard-members";
import { formatInstant } from "@/features/dashboard/lib/dashboard-format";
import type {
  InviteSummary,
  MemberSummary,
} from "@/features/members/types/members.types";

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
      key: "delivery",
      label: "Delivery",
      render: (invite) => (
        <Badge tone={invite.emailDeliveryStatus === "FAILED" ? "warning" : "info"}>
          {invite.emailDeliveryStatus || "UNKNOWN"}
        </Badge>
      ),
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
