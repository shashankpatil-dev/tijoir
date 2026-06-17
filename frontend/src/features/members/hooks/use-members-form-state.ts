import { useState } from "react";
import type { InviteSummary, MemberSummary } from "@/features/members/types/members.types";

export function useMembersFormState() {
  const [createInviteOpen, setCreateInviteOpen] = useState(false);
  const [memberRoleDialogOpen, setMemberRoleDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberSummary | null>(null);
  const [inviteRevokeTarget, setInviteRevokeTarget] = useState<InviteSummary | null>(null);
  const [memberRemoveTarget, setMemberRemoveTarget] = useState<MemberSummary | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [memberRoleValue, setMemberRoleValue] = useState("MEMBER");

  return {
    createInviteOpen,
    inviteEmail,
    inviteRevokeTarget,
    inviteRole,
    memberRemoveTarget,
    memberRoleDialogOpen,
    memberRoleValue,
    selectedMember,
    setCreateInviteOpen,
    setInviteEmail,
    setInviteRevokeTarget,
    setInviteRole,
    setMemberRemoveTarget,
    setMemberRoleDialogOpen,
    setMemberRoleValue,
    setSelectedMember,
  };
}
