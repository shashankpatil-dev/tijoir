import { PageSection } from "@/components/dashboard/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { InlineMessage } from "@/components/ui/feedback";
import {
  FilterSelect,
  PaginationControls,
  SearchInput,
  TableToolbar,
} from "@/components/ui/table-controls";
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
    <div className="space-y-5">
      <InlineMessage
        body="Audit events are append-only evidence for secret, sharing, membership, and vendor actions."
        title="Audit evidence"
        tone="neutral"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <PageSection
          description="Matched audit events across the current filter scope."
          title="Total events"
        >
          <p className="text-3xl font-semibold text-[var(--color-ink-strong)]">
            {auditReport?.totalEvents ?? auditTotal}
          </p>
        </PageSection>
        <PageSection
          description="Recent activity window for the last 24 hours."
          title="Last 24 hours"
        >
          <p className="text-3xl font-semibold text-[var(--color-ink-strong)]">
            {auditReport?.eventsInLast24Hours ?? 0}
          </p>
        </PageSection>
        <PageSection
          description="Export the filtered audit evidence as a CSV file."
          title="Reporting"
        >
          <div className="flex h-full items-end justify-end">
            <Button onClick={() => void handleAuditExport()} type="button" variant="secondary">
              Export CSV
            </Button>
          </div>
        </PageSection>
      </div>

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

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-[var(--color-dashboard-border)] bg-[var(--color-surface)] p-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-ink-strong)]">
                  Action breakdown
                </h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Most frequent matching actions.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {actionBreakdown.length ? (
                  actionBreakdown.map(([label, count]) => (
                    <Badge key={label} tone="neutral">
                      {label}: {count}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-[var(--color-muted)]">No action data yet.</p>
                )}
              </div>
            </div>
            <div className="space-y-3 rounded-2xl border border-[var(--color-dashboard-border)] bg-[var(--color-surface)] p-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-ink-strong)]">
                  Resource breakdown
                </h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Most frequent matching resource types.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {resourceBreakdown.length ? (
                  resourceBreakdown.map(([label, count]) => (
                    <Badge key={label} tone="neutral">
                      {label}: {count}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-[var(--color-muted)]">No resource data yet.</p>
                )}
              </div>
            </div>
          </div>

          <DataTable
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
    </div>
  );
}
