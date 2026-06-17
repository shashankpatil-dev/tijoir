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
import type {
  ContractPermission,
  ShareLinkResponse,
} from "@/features/share-links/types/share-links.types";

export function ShareLinkInventorySection({
  contractPermissions,
  filteredShareLinksLength,
  loadingWorkspace,
  onCreateShareLink,
  paginatedShareLinks,
  selectedShareLinkId,
  setSelectedShareLinkId,
  setSharePage,
  setSharePermissionFilter,
  setShareSearch,
  setShareStatusFilter,
  shareColumns,
  shareLinks,
  sharePage,
  sharePageCount,
  sharePermissionFilter,
  shareSearch,
  shareStatusFilter,
  shareTotal,
}: {
  contractPermissions: ContractPermission[];
  filteredShareLinksLength: number;
  loadingWorkspace: boolean;
  onCreateShareLink: () => void;
  paginatedShareLinks: ShareLinkResponse[];
  selectedShareLinkId: string;
  setSelectedShareLinkId: (value: string) => void;
  setSharePage: (page: number) => void;
  setSharePermissionFilter: (value: string) => void;
  setShareSearch: (value: string) => void;
  setShareStatusFilter: (value: string) => void;
  shareColumns: DataTableColumn<ShareLinkResponse>[];
  shareLinks: ShareLinkResponse[];
  sharePage: number;
  sharePageCount: number;
  sharePermissionFilter: string;
  shareSearch: string;
  shareStatusFilter: string;
  shareTotal: number;
}) {
  return (
    <PageSection
      description="Issued contract-scoped access links for external recipients."
      title="Share-link inventory"
    >
      <div className="space-y-4">
        <TableToolbar
          actions={
            <Button onClick={onCreateShareLink} type="button">
              Create share link
            </Button>
          }
        >
          <SearchInput
            onChange={setShareSearch}
            placeholder="Search by secret name, key, or recipient"
            value={shareSearch}
          />
          <FilterSelect
            onChange={setShareStatusFilter}
            options={[
              { label: "All statuses", value: "ALL" },
              { label: "Active", value: "ACTIVE" },
              { label: "Revoked", value: "REVOKED" },
              { label: "Consumed", value: "CONSUMED" },
              { label: "Expired", value: "EXPIRED" },
            ]}
            value={shareStatusFilter}
          />
          <FilterSelect
            onChange={setSharePermissionFilter}
            options={[
              { label: "All permissions", value: "ALL" },
              ...contractPermissions.map((permission) => ({
                label: permission,
                value: permission,
              })),
            ]}
            value={sharePermissionFilter}
          />
        </TableToolbar>

        <DataTable
          containerClassName="max-h-[30rem]"
          columns={shareColumns}
          data={paginatedShareLinks}
          emptyDescription="Create a share link for a vault secret to start the recipient flow."
          emptyTitle="No share links match the current filters"
          loading={loadingWorkspace && !shareLinks.length}
          onRowClick={(shareLink) => setSelectedShareLinkId(shareLink.id)}
          rowKey={(shareLink) => shareLink.id}
          selectedRowKey={selectedShareLinkId}
        />

        <PaginationControls
          currentPage={sharePage}
          itemLabel="share links"
          onPageChange={setSharePage}
          pageCount={sharePageCount}
          totalItems={shareTotal || filteredShareLinksLength}
        />
      </div>
    </PageSection>
  );
}
