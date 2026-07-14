"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useDashboardWorkspaceContext } from "@/features/dashboard/components/dashboard-workspace-context";
import { ChangeMemberRoleDialog } from "@/features/members/components/change-member-role-dialog";
import { CreateInviteDialog } from "@/features/members/components/create-invite-dialog";
import { MembersView } from "@/features/members/components/members-view";
import { useMembersWorkspace } from "@/features/members/hooks/use-members-workspace";

export default function DashboardOrganizationPage() {
  const shell = useDashboardWorkspaceContext();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const members = useMembersWorkspace({
    handleSessionError: shell.handleSessionError,
    router: shell.router,
    sessionAccessToken: shell.session?.accessToken ?? undefined,
    sessionUserEmail: shell.session?.user.email,
    sessionUserRole: shell.session?.user.role,
    setActionBusy: shell.setActionBusy,
    setMessage: shell.setMessage,
    showToast: shell.showToast,
  });

  useEffect(() => {
    if (searchParams.get("create") !== "1") {
      return;
    }

    members.setCreateInviteOpen(true);
    router.replace(pathname);
  }, [members.setCreateInviteOpen, pathname, router, searchParams]);

  return (
    <>
      <MembersView
        filteredInvitesLength={members.filteredInvitesLength}
        filteredMembersLength={members.filteredMembersLength}
        inviteColumns={members.inviteColumns}
        invitePage={members.invitePage}
        invitePageCount={members.invitePageCount}
        inviteSearch={members.inviteSearch}
        inviteStatusFilter={members.inviteStatusFilter}
        invites={members.invites}
        loadingWorkspace={members.loadingMembers}
        memberColumns={members.memberColumns}
        memberPage={members.memberPage}
        memberPageCount={members.memberPageCount}
        memberRoleFilter={members.memberRoleFilter}
        memberSearch={members.memberSearch}
        members={members.members}
        membersAvailable={shell.isOrganizationManager}
        onOpenSettings={() => shell.router.push("/dashboard/settings")}
        onCreateInvite={() => members.setCreateInviteOpen(true)}
        paginatedInvites={members.invites}
        paginatedMembers={members.members}
        session={shell.session}
        setInvitePage={members.setInvitePage}
        setInviteSearch={members.setInviteSearch}
        setInviteStatusFilter={members.setInviteStatusFilter}
        setMemberPage={members.setMemberPage}
        setMemberRoleFilter={members.setMemberRoleFilter}
        setMemberSearch={members.setMemberSearch}
        totalInvites={members.invitesTotal}
        totalMembers={members.membersTotal}
      />

      <CreateInviteDialog
        actionBusy={shell.actionBusy}
        assignableRoles={members.assignableRoles}
        inviteEmail={members.inviteEmail}
        inviteRole={members.inviteRole}
        onClose={() => members.setCreateInviteOpen(false)}
        onSubmit={members.handleCreateInvite}
        open={members.createInviteOpen}
        setInviteEmail={members.setInviteEmail}
        setInviteRole={members.setInviteRole}
      />

      <ChangeMemberRoleDialog
        actionBusy={shell.actionBusy}
        assignableRoles={members.assignableRoles}
        memberRoleValue={members.memberRoleValue}
        onClose={() => members.setMemberRoleDialogOpen(false)}
        onSubmit={members.handleUpdateMemberRole}
        open={members.memberRoleDialogOpen}
        selectedMember={members.selectedMember}
        setMemberRoleValue={members.setMemberRoleValue}
      />

      <ConfirmDialog
        confirmLabel="Revoke invite"
        description={
          members.inviteRevokeTarget
            ? `Revoke the invite for ${members.inviteRevokeTarget.email}. The accept token should stop working immediately.`
            : ""
        }
        onClose={() => members.setInviteRevokeTarget(null)}
        onConfirm={() => {
          if (members.inviteRevokeTarget) {
            void members.handleRevokeInvite(members.inviteRevokeTarget.id);
          }
          members.setInviteRevokeTarget(null);
        }}
        open={Boolean(members.inviteRevokeTarget)}
        title="Revoke invite"
      />

      <ConfirmDialog
        confirmLabel="Remove member"
        description={
          members.memberRemoveTarget
            ? `Remove ${members.memberRemoveTarget.email} from the organization.`
            : ""
        }
        onClose={() => members.setMemberRemoveTarget(null)}
        onConfirm={() => {
          if (members.memberRemoveTarget) {
            void members.handleRemoveMember(members.memberRemoveTarget.id);
          }
          members.setMemberRemoveTarget(null);
        }}
        open={Boolean(members.memberRemoveTarget)}
        title="Remove member"
      />
    </>
  );
}
