import { EmptyState, PageSection } from "@/components/dashboard/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import {
  FilterSelect,
  PaginationControls,
  SearchInput,
  TableToolbar,
} from "@/components/ui/table-controls";
import { SurfaceNote } from "@/features/dashboard/components/surface-note";
import type {
  AuditAction,
  AuditEventResponse,
  AuditReportResponse,
} from "@/features/audit/types/audit.types";

export function AuditView({
  auditActionFilter,
  auditColumns,
  auditEvents,
  auditPage,
  auditPageCount,
  auditQuery,
  auditReport,
  auditResourceTypeFilter,
  auditTotal,
  handleAuditExport,
  loadingWorkspace,
  setAuditActionFilter,
  setAuditPage,
  setAuditQuery,
  setAuditResourceTypeFilter,
}: {
  auditActionFilter: string;
  auditColumns: DataTableColumn<AuditEventResponse>[];
  auditEvents: AuditEventResponse[];
  auditPage: number;
  auditPageCount: number;
  auditQuery: string;
  auditReport?: AuditReportResponse | null;
  auditResourceTypeFilter: string;
  auditTotal: number;
  handleAuditExport: () => Promise<void>;
  loadingWorkspace: boolean;
  setAuditActionFilter: (value: string) => void;
  setAuditPage: (page: number) => void;
  setAuditQuery: (value: string) => void;
  setAuditResourceTypeFilter: (value: string) => void;
}) {
  const actionBreakdown = Object.entries(auditReport?.byAction ?? {}).slice(0, 6);
  const resourceBreakdown = Object.entries(auditReport?.byResourceType ?? {}).slice(0, 6);

  return (
    <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <PageSection
        description="Review the organization event trail with action and resource filters."
        title="Audit log"
      >
        <div className="space-y-4">
          <TableToolbar>
            <SearchInput
              onChange={setAuditQuery}
              placeholder="Search by actor, action, resource, or event details"
              value={auditQuery}
            />
            <FilterSelect
              onChange={setAuditActionFilter}
              options={[
                { label: "All actions", value: "ALL" },
                { label: "SECRET_CREATED", value: "SECRET_CREATED" },
                { label: "SECRET_REVEALED", value: "SECRET_REVEALED" },
                { label: "SECRET_REVOKED", value: "SECRET_REVOKED" },
                { label: "SECRET_ROTATED", value: "SECRET_ROTATED" },
                { label: "SHARE_LINK_CREATED", value: "SHARE_LINK_CREATED" },
                { label: "SHARE_LINK_CONSUMED", value: "SHARE_LINK_CONSUMED" },
                { label: "SHARE_LINK_REVOKED", value: "SHARE_LINK_REVOKED" },
                { label: "VENDOR_CREATED", value: "VENDOR_CREATED" },
                { label: "VENDOR_CONTRACT_CREATED", value: "VENDOR_CONTRACT_CREATED" },
                { label: "VENDOR_CONTRACT_REVOKED", value: "VENDOR_CONTRACT_REVOKED" },
                { label: "VENDOR_OFFBOARDED", value: "VENDOR_OFFBOARDED" },
                { label: "MEMBER_INVITED", value: "MEMBER_INVITED" },
                { label: "MEMBER_INVITE_ACCEPTED", value: "MEMBER_INVITE_ACCEPTED" },
                { label: "MEMBER_INVITE_REVOKED", value: "MEMBER_INVITE_REVOKED" },
                { label: "MEMBER_ROLE_UPDATED", value: "MEMBER_ROLE_UPDATED" },
                { label: "MEMBER_REMOVED", value: "MEMBER_REMOVED" },
                {
                  label: "ORGANIZATION_POLICY_UPDATED",
                  value: "ORGANIZATION_POLICY_UPDATED",
                },
              ]}
              value={auditActionFilter}
            />
            <FilterSelect
              onChange={setAuditResourceTypeFilter}
              options={[
                { label: "All resources", value: "ALL" },
                { label: "SECRET", value: "SECRET" },
                { label: "SHARE_LINK", value: "SHARE_LINK" },
                { label: "VENDOR", value: "VENDOR" },
                { label: "VENDOR_ACCESS_CONTRACT", value: "VENDOR_ACCESS_CONTRACT" },
                { label: "MEMBER", value: "MEMBER" },
                { label: "ORGANIZATION_INVITE", value: "ORGANIZATION_INVITE" },
                { label: "ORGANIZATION_POLICY", value: "ORGANIZATION_POLICY" },
              ]}
              value={auditResourceTypeFilter}
            />
          </TableToolbar>

          <DataTable
            containerClassName="max-h-[34rem]"
            columns={auditColumns}
            data={auditEvents}
            emptyDescription="No audit records match the current filters."
            emptyTitle="No audit events to show"
            loading={loadingWorkspace && !auditEvents.length}
            rowKey={(event) => event.id}
          />

          <PaginationControls
            currentPage={auditPage}
            itemLabel="audit events"
            onPageChange={setAuditPage}
            pageCount={auditPageCount}
            totalItems={auditTotal}
          />
        </div>
      </PageSection>

      <div className="space-y-5">
        <PageSection
          description="Current audit scope and export action for the visible filters."
          title="Audit summary"
        >
          <div className="space-y-3">
            <SurfaceNote
              label="Matched events"
              value={String(auditReport?.totalEvents ?? auditTotal)}
            />
            <SurfaceNote
              label="Last 24 hours"
              value={String(auditReport?.eventsInLast24Hours ?? 0)}
            />
            <SurfaceNote
              label="Current action filter"
              value={auditActionFilter === "ALL" ? "All actions" : auditActionFilter}
            />
            <SurfaceNote
              label="Current resource filter"
              value={
                auditResourceTypeFilter === "ALL"
                  ? "All resources"
                  : auditResourceTypeFilter
              }
            />
            <div className="flex flex-wrap gap-3 pt-1">
              <Button
                onClick={() => void handleAuditExport()}
                type="button"
                variant="secondary"
              >
                Export CSV
              </Button>
            </div>
          </div>
        </PageSection>

        <PageSection
          description="Most frequent matching actions in the current audit slice."
          title="Action breakdown"
        >
          <div className="flex flex-wrap gap-2">
            {actionBreakdown.length ? (
              actionBreakdown.map(([label, count]) => (
                <Badge key={label} tone="neutral">
                  {label}: {count}
                </Badge>
              ))
            ) : (
              <EmptyState
                description="Export or broaden the filters after more activity lands in this workspace."
                title="No action data yet"
              />
            )}
          </div>
        </PageSection>

        <PageSection
          description="Most frequent matching resource types in the current audit slice."
          title="Resource breakdown"
        >
          <div className="flex flex-wrap gap-2">
            {resourceBreakdown.length ? (
              resourceBreakdown.map(([label, count]) => (
                <Badge key={label} tone="neutral">
                  {label}: {count}
                </Badge>
              ))
            ) : (
              <EmptyState
                description="Use broader filters or wait for more activity to build the resource distribution."
                title="No resource data yet"
              />
            )}
          </div>
        </PageSection>

        <PageSection
          description="Keep the audit surface useful for reviews, incidents, and handoff evidence."
          title="Investigation notes"
        >
          <div className="space-y-3">
            <SurfaceNote
              label="Start narrow"
              value="Use action and resource filters first, then search by actor or target object."
            />
            <SurfaceNote
              label="Export when ready"
              value="Download the filtered slice only after the scope is clean enough to hand to another reviewer."
            />
            <SurfaceNote
              label="Watch policy changes"
              value="Policy updates, contract revokes, and member-role changes usually deserve the fastest follow-up."
            />
          </div>
        </PageSection>
      </div>
    </div>
  );
}
