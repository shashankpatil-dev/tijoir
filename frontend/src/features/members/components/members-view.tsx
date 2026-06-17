import { EmptyState, PageSection } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { InlineMessage } from "@/components/ui/feedback";
import {
  FilterSelect,
  PaginationControls,
  SearchInput,
  TableToolbar,
} from "@/components/ui/table-controls";
import { SharePreviewItem } from "@/features/dashboard/components/share-preview-item";
import { SurfaceNote } from "@/features/dashboard/components/surface-note";
import { formatInstant } from "@/features/dashboard/lib/dashboard-format";
import type {
  InviteSummary,
  MemberSummary,
} from "@/features/members/types/members.types";
import type { AuthResponse } from "@/features/auth/types/auth.types";

type InvitePreview = {
  token: string;
  appUrl: string;
};

export function MembersView({
  copyText,
  filteredInvitesLength,
  filteredMembersLength,
  inviteColumns,
  invitePage,
  invitePageCount,
  inviteSearch,
  inviteStatusFilter,
  invites,
  lastCreatedInvite,
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
  copyText: (value: string, label: string) => Promise<void>;
  filteredInvitesLength: number;
  filteredMembersLength: number;
  inviteColumns: DataTableColumn<InviteSummary>[];
  invitePage: number;
  invitePageCount: number;
  inviteSearch: string;
  inviteStatusFilter: string;
  invites: InviteSummary[];
  lastCreatedInvite: InvitePreview | null;
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
  return (
    <div className="space-y-5">
      {!membersAvailable ? (
        <InlineMessage
          body="Only organization managers can manage the organization profile, team roles, and invites."
          title="Organization access unavailable"
          tone="warning"
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <PageSection
              description="Profile, workspace ownership, and the current signed-in access context."
              title="Organization profile"
            >
              {session ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <SurfaceNote label="Organization" value={session.organization.name} />
                  <SurfaceNote label="Workspace slug" value={session.organization.slug} />
                  <SurfaceNote label="Organization email" value={session.organization.email} />
                  <SurfaceNote
                    label="Signed in as"
                    value={`${session.user.name} · ${session.user.role}`}
                  />
                  <SurfaceNote label="User email" value={session.user.email} />
                  <SurfaceNote
                    label="Session expires"
                    value={formatInstant(session.expiresAt)}
                  />
                  <div className="flex flex-wrap gap-3 lg:col-span-2">
                    <Button onClick={onCreateInvite} type="button">
                      Invite member
                    </Button>
                    <Button onClick={onOpenSettings} type="button" variant="secondary">
                      Open policy settings
                    </Button>
                  </div>
                </div>
              ) : (
                <EmptyState
                  description="The current organization profile is not available."
                  title="No organization context"
                />
              )}
            </PageSection>

            <PageSection
              description="Current organization users and their assigned roles."
              title="Team members"
            >
              <div className="space-y-4">
                <TableToolbar
                  actions={
                    <Button onClick={onCreateInvite} type="button">
                      Invite member
                    </Button>
                  }
                >
                  <SearchInput
                    onChange={setMemberSearch}
                    placeholder="Search by name or email"
                    value={memberSearch}
                  />
                  <FilterSelect
                    onChange={setMemberRoleFilter}
                    options={[
                      { label: "All roles", value: "ALL" },
                      { label: "ORG_OWNER", value: "ORG_OWNER" },
                      { label: "ADMIN", value: "ADMIN" },
                      { label: "MEMBER", value: "MEMBER" },
                      { label: "VIEWER", value: "VIEWER" },
                      { label: "AUDITOR", value: "AUDITOR" },
                    ]}
                    value={memberRoleFilter}
                  />
                </TableToolbar>

                <DataTable
                  columns={memberColumns}
                  data={paginatedMembers}
                  emptyDescription="Invite the next workspace user to move beyond the single-owner setup."
                  emptyTitle="No members match the current filters"
                  loading={loadingWorkspace && membersAvailable && !members.length}
                  rowKey={(member) => member.id}
                />

                <PaginationControls
                  currentPage={memberPage}
                  itemLabel="members"
                  onPageChange={setMemberPage}
                  pageCount={memberPageCount}
                  totalItems={totalMembers || filteredMembersLength}
                />
              </div>
            </PageSection>

            <PageSection
              description="Issued invites stay here until accepted, revoked, or expired."
              title="Invites"
            >
              <div className="space-y-4">
                <TableToolbar>
                  <SearchInput
                    onChange={setInviteSearch}
                    placeholder="Search by invite email or role"
                    value={inviteSearch}
                  />
                  <FilterSelect
                    onChange={setInviteStatusFilter}
                    options={[
                      { label: "All statuses", value: "ALL" },
                      { label: "Pending", value: "PENDING" },
                      { label: "Accepted", value: "ACCEPTED" },
                      { label: "Revoked", value: "REVOKED" },
                      { label: "Expired", value: "EXPIRED" },
                    ]}
                    value={inviteStatusFilter}
                  />
                </TableToolbar>

                <DataTable
                  columns={inviteColumns}
                  data={paginatedInvites}
                  emptyDescription="No invite records match the current filters."
                  emptyTitle="No invites to show"
                  loading={loadingWorkspace && membersAvailable && !invites.length}
                  rowKey={(invite) => invite.id}
                />

                <PaginationControls
                  currentPage={invitePage}
                  itemLabel="invites"
                  onPageChange={setInvitePage}
                  pageCount={invitePageCount}
                  totalItems={totalInvites || filteredInvitesLength}
                />
              </div>
            </PageSection>
          </div>

          <div className="space-y-5">
            <PageSection
              description="The newest invite package is staged here so the owner or admin can hand it to the recipient while email delivery remains out of scope."
              title="Latest invite package"
            >
              {lastCreatedInvite ? (
                <div className="space-y-4">
                  <SharePreviewItem
                    label="Invite accept URL"
                    onCopy={() => void copyText(lastCreatedInvite.appUrl, "Invite URL")}
                    value={lastCreatedInvite.appUrl}
                  />
                  <SharePreviewItem
                    label="Invite token"
                    onCopy={() => void copyText(lastCreatedInvite.token, "Invite token")}
                    value={lastCreatedInvite.token}
                  />
                </div>
              ) : (
                <EmptyState
                  description="Create an invite to stage the member onboarding URL and token."
                  title="No invite package yet"
                />
              )}
            </PageSection>

            <PageSection
              description="Current role boundaries in this workspace."
              title="Access model"
            >
              <div className="space-y-3">
                <SurfaceNote
                  label="ORG_OWNER"
                  value="Organization-level control, including member and admin management."
                />
                <SurfaceNote
                  label="ADMIN"
                  value="Can manage members except owners and other admins, and can operate vault and share workflows."
                />
                <SurfaceNote
                  label="MEMBER / VIEWER / AUDITOR"
                  value="Operational or read-focused roles without organization-user administration."
                />
              </div>
            </PageSection>
          </div>
        </div>
      )}
    </div>
  );
}
