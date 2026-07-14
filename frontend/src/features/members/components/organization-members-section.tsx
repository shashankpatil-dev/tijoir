"use client";

import { PageSection } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import {
  FilterSelect,
  PaginationControls,
  SearchInput,
  TableToolbar,
} from "@/components/ui/table-controls";
import type { MemberSummary } from "@/features/members/types/members.types";

export function OrganizationMembersSection({
  filteredMembersLength,
  loadingWorkspace,
  memberColumns,
  memberPage,
  memberPageCount,
  memberRoleFilter,
  memberSearch,
  members,
  onCreateInvite,
  paginatedMembers,
  setMemberPage,
  setMemberRoleFilter,
  setMemberSearch,
  totalMembers,
}: {
  filteredMembersLength: number;
  loadingWorkspace: boolean;
  memberColumns: DataTableColumn<MemberSummary>[];
  memberPage: number;
  memberPageCount: number;
  memberRoleFilter: string;
  memberSearch: string;
  members: MemberSummary[];
  onCreateInvite: () => void;
  paginatedMembers: MemberSummary[];
  setMemberPage: (page: number) => void;
  setMemberRoleFilter: (value: string) => void;
  setMemberSearch: (value: string) => void;
  totalMembers: number;
}) {
  return (
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
          containerClassName="max-h-120"
          columns={memberColumns}
          data={paginatedMembers}
          emptyDescription="Invite the next workspace user to move beyond the single-owner setup."
          emptyTitle="No members match the current filters"
          loading={loadingWorkspace && !members.length}
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
  );
}
