"use client";

import { useState } from "react";
import { DashboardSectionTabs } from "@/components/dashboard/dashboard-section-tabs";
import { type DataTableColumn } from "@/components/ui/data-table";
import { InlineMessage } from "@/components/ui/feedback";
import type {
  InviteSummary,
  MemberSummary,
} from "@/features/members/types/members.types";
import type { AuthResponse } from "@/features/auth/types/auth.types";
import {
  OrganizationInvitesSection,
  OrganizationMembersSection,
  OrganizationProfileSection,
} from "@/features/members/components/organization-sections";

type OrganizationTabKey = "profile" | "members" | "invites";

export function MembersView({
  filteredInvitesLength,
  filteredMembersLength,
  inviteColumns,
  invitePage,
  invitePageCount,
  inviteSearch,
  inviteStatusFilter,
  invites,
  loadingWorkspace,
  memberColumns,
  memberPage,
  memberPageCount,
  memberRoleFilter,
  memberSearch,
  members,
  membersAvailable,
  onOpenSettings,
  onCreateInvite,
  paginatedInvites,
  paginatedMembers,
  session,
  setInvitePage,
  setInviteSearch,
  setInviteStatusFilter,
  setMemberPage,
  setMemberRoleFilter,
  setMemberSearch,
  totalInvites,
  totalMembers,
}: {
  filteredInvitesLength: number;
  filteredMembersLength: number;
  inviteColumns: DataTableColumn<InviteSummary>[];
  invitePage: number;
  invitePageCount: number;
  inviteSearch: string;
  inviteStatusFilter: string;
  invites: InviteSummary[];
  loadingWorkspace: boolean;
  memberColumns: DataTableColumn<MemberSummary>[];
  memberPage: number;
  memberPageCount: number;
  memberRoleFilter: string;
  memberSearch: string;
  members: MemberSummary[];
  membersAvailable: boolean;
  onOpenSettings: () => void;
  onCreateInvite: () => void;
  paginatedInvites: InviteSummary[];
  paginatedMembers: MemberSummary[];
  session: AuthResponse | null;
  setInvitePage: (page: number) => void;
  setInviteSearch: (value: string) => void;
  setInviteStatusFilter: (value: string) => void;
  setMemberPage: (page: number) => void;
  setMemberRoleFilter: (value: string) => void;
  setMemberSearch: (value: string) => void;
  totalInvites: number;
  totalMembers: number;
}) {
  const [activeTab, setActiveTab] = useState<OrganizationTabKey>("profile");

  return (
    <div className="space-y-5">
      {!membersAvailable ? (
        <InlineMessage
          body="Only organization managers can manage the organization profile, team roles, and invites."
          title="Organization access unavailable"
          tone="warning"
        />
      ) : (
        <div className="space-y-5">
          <DashboardSectionTabs
            activeTab={activeTab}
            items={[
              { key: "profile", label: "Profile" },
              { key: "members", label: "Members" },
              { key: "invites", label: "Invites" },
            ]}
            onChange={setActiveTab}
          />

          {activeTab === "profile" ? (
            <OrganizationProfileSection
              onCreateInvite={onCreateInvite}
              onOpenSettings={onOpenSettings}
              session={session}
            />
          ) : null}

          {activeTab === "members" ? (
            <OrganizationMembersSection
              filteredMembersLength={filteredMembersLength}
              loadingWorkspace={loadingWorkspace}
              memberColumns={memberColumns}
              memberPage={memberPage}
              memberPageCount={memberPageCount}
              memberRoleFilter={memberRoleFilter}
              memberSearch={memberSearch}
              members={members}
              onCreateInvite={onCreateInvite}
              paginatedMembers={paginatedMembers}
              setMemberPage={setMemberPage}
              setMemberRoleFilter={setMemberRoleFilter}
              setMemberSearch={setMemberSearch}
              totalMembers={totalMembers}
            />
          ) : null}

          {activeTab === "invites" ? (
            <OrganizationInvitesSection
              filteredInvitesLength={filteredInvitesLength}
              inviteColumns={inviteColumns}
              invitePage={invitePage}
              invitePageCount={invitePageCount}
              inviteSearch={inviteSearch}
              inviteStatusFilter={inviteStatusFilter}
              invites={invites}
              loadingWorkspace={loadingWorkspace}
              paginatedInvites={paginatedInvites}
              setInvitePage={setInvitePage}
              setInviteSearch={setInviteSearch}
              setInviteStatusFilter={setInviteStatusFilter}
              totalInvites={totalInvites}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
