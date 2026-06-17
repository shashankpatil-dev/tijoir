"use client";

import { useDashboardWorkspaceContext } from "@/features/dashboard/components/dashboard-workspace-context";
import { MembersView } from "@/features/members/components/members-view";

export default function DashboardOrganizationPage() {
  const workspace = useDashboardWorkspaceContext();

  return (
    <MembersView
      copyText={workspace.copyText}
      filteredInvitesLength={workspace.filteredInvites.length}
      filteredMembersLength={workspace.filteredMembers.length}
      inviteColumns={workspace.inviteColumns}
      invitePage={workspace.invitePage}
      invitePageCount={workspace.invitePageCount}
      inviteSearch={workspace.inviteSearch}
      inviteStatusFilter={workspace.inviteStatusFilter}
      invites={workspace.invites}
      lastCreatedInvite={workspace.lastCreatedInvite}
      loadingWorkspace={workspace.loadingWorkspace}
      memberColumns={workspace.memberColumns}
      memberPage={workspace.memberPage}
      memberPageCount={workspace.memberPageCount}
      memberRoleFilter={workspace.memberRoleFilter}
      memberSearch={workspace.memberSearch}
      members={workspace.members}
      membersAvailable={workspace.membersAvailable}
      onOpenSettings={() => workspace.router.push("/dashboard/settings")}
      onCreateInvite={() => workspace.setCreateInviteOpen(true)}
      paginatedInvites={workspace.paginatedInvites}
      paginatedMembers={workspace.paginatedMembers}
      session={workspace.session}
      setInvitePage={workspace.setInvitePage}
      setInviteSearch={workspace.setInviteSearch}
      setInviteStatusFilter={workspace.setInviteStatusFilter}
      setMemberPage={workspace.setMemberPage}
      setMemberRoleFilter={workspace.setMemberRoleFilter}
      setMemberSearch={workspace.setMemberSearch}
      totalInvites={workspace.invitesTotal}
      totalMembers={workspace.membersTotal}
    />
  );
}
