import { Badge, statusTone } from "@/components/ui/badge";
import type { DataTableColumn } from "@/components/ui/data-table";
import { Menu, MenuItem } from "@/components/ui/menu";
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
      sortable: true,
      sortValue: (member) => member.name || member.email,
      render: (member) => (
        <div className="space-y-1">
          <p className="font-semibold text-(--color-ink-strong)">{member.name}</p>
          <p className="text-xs text-muted">{member.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      sortValue: (member) => member.role,
      render: (member) => <Badge tone="info">{member.role}</Badge>,
    },
    {
      key: "verified",
      label: "Verified",
      sortable: true,
      sortValue: (member) => (member.emailVerified ? 1 : 0),
      render: (member) => (
        <Badge tone={member.emailVerified ? "success" : "warning"}>
          {member.emailVerified ? "Verified" : "Pending"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Joined",
      sortable: true,
      sortValue: (member) => new Date(member.createdAt).getTime(),
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
            <span>Change role</span>
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (canRemoveMember(actorRole, member, actorEmail)) {
                onRemove(member);
              }
            }}
          >
            <span>Remove member</span>
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
      sortable: true,
      sortValue: (invite) => invite.email,
      render: (invite) => (
        <div className="space-y-1">
          <p className="font-semibold text-(--color-ink-strong)">{invite.email}</p>
          <p className="text-xs text-muted">
            Invited by {invite.invitedByName}
          </p>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      sortValue: (invite) => invite.role,
      render: (invite) => <Badge tone="info">{invite.role}</Badge>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      sortValue: (invite) => invite.status,
      render: (invite) => <Badge tone={statusTone(invite.status)}>{invite.status}</Badge>,
    },
    {
      key: "delivery",
      label: "Delivery",
      sortable: true,
      sortValue: (invite) => invite.emailDeliveryStatus || "",
      render: (invite) => (
        <Badge tone={invite.emailDeliveryStatus === "FAILED" ? "warning" : "info"}>
          {invite.emailDeliveryStatus || "UNKNOWN"}
        </Badge>
      ),
    },
    {
      key: "expiresAt",
      label: "Expiry",
      sortable: true,
      sortValue: (invite) => (invite.expiresAt ? new Date(invite.expiresAt).getTime() : 0),
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
            <span>Revoke invite</span>
          </MenuItem>
        </Menu>
      ),
    },
  ];
}
