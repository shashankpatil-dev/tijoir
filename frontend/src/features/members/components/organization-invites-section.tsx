"use client";

import { PageSection } from "@/components/dashboard/dashboard-shell";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import {
  FilterSelect,
  PaginationControls,
  SearchInput,
  TableToolbar,
} from "@/components/ui/table-controls";
import type { InviteSummary } from "@/features/members/types/members.types";

export function OrganizationInvitesSection({
  filteredInvitesLength,
  inviteColumns,
  invitePage,
  invitePageCount,
  inviteSearch,
  inviteStatusFilter,
  invites,
  loadingWorkspace,
  paginatedInvites,
  setInvitePage,
  setInviteSearch,
  setInviteStatusFilter,
  totalInvites,
}: {
  filteredInvitesLength: number;
  inviteColumns: DataTableColumn<InviteSummary>[];
  invitePage: number;
  invitePageCount: number;
  inviteSearch: string;
  inviteStatusFilter: string;
  invites: InviteSummary[];
  loadingWorkspace: boolean;
  paginatedInvites: InviteSummary[];
  setInvitePage: (page: number) => void;
  setInviteSearch: (value: string) => void;
  setInviteStatusFilter: (value: string) => void;
  totalInvites: number;
}) {
  return (
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
          containerClassName="max-h-[30rem]"
          columns={inviteColumns}
          data={paginatedInvites}
          emptyDescription="No invite records match the current filters."
          emptyTitle="No invites to show"
          loading={loadingWorkspace && !invites.length}
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
  );
}
