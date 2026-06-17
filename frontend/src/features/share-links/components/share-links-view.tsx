import {
  DetailList,
  EmptyState,
  PageSection,
} from "@/components/dashboard/dashboard-shell";
import { Badge, statusTone } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { InlineMessage } from "@/components/ui/feedback";
import {
  FilterSelect,
  PaginationControls,
  SearchInput,
  TableToolbar,
} from "@/components/ui/table-controls";
import { Button } from "@/components/ui/button";
import { SharePreviewItem } from "@/features/dashboard/components/share-preview-item";
import { SurfaceNote } from "@/features/dashboard/components/surface-note";
import { formatInstant } from "@/features/dashboard/lib/dashboard-format";
import type {
  ContractPermission,
  ShareLinkResponse,
} from "@/features/share-links/types/share-links.types";

type SharePreview = {
  token: string;
  appUrl: string;
};

export function ShareLinksView({
  contractPermissions,
  copyText,
  filteredShareLinksLength,
  lastCreatedShare,
  loadingWorkspace,
  onCopySelectedAppUrl,
  onCopySelectedToken,
  onCreateShareLink,
  onRevokeSelectedShareLink,
  paginatedShareLinks,
  selectedShareLink,
  selectedShareLinkAppUrl,
  selectedShareLinkId,
  setSelectedShareLinkId,
  setSharePage,
  setSharePermissionFilter,
  setShareSearch,
  setShareStatusFilter,
  shareColumns,
  shareLinks,
  shareLinksAvailable,
  sharePage,
  sharePageCount,
  sharePermissionFilter,
  shareSearch,
  shareStatusFilter,
  shareTotal,
}: {
  contractPermissions: ContractPermission[];
  copyText: (value: string, label: string) => Promise<void>;
  filteredShareLinksLength: number;
  lastCreatedShare: SharePreview | null;
  loadingWorkspace: boolean;
  onCopySelectedAppUrl: (value: string) => void;
  onCopySelectedToken: (value: string) => void;
  onCreateShareLink: () => void;
  onRevokeSelectedShareLink: () => void;
  paginatedShareLinks: ShareLinkResponse[];
  selectedShareLink: ShareLinkResponse | null;
  selectedShareLinkAppUrl: string | null;
  selectedShareLinkId: string;
  setSelectedShareLinkId: (value: string) => void;
  setSharePage: (page: number) => void;
  setSharePermissionFilter: (value: string) => void;
  setShareSearch: (value: string) => void;
  setShareStatusFilter: (value: string) => void;
  shareColumns: DataTableColumn<ShareLinkResponse>[];
  shareLinks: ShareLinkResponse[];
  shareLinksAvailable: boolean;
  sharePage: number;
  sharePageCount: number;
  sharePermissionFilter: string;
  shareSearch: string;
  shareStatusFilter: string;
  shareTotal: number;
}) {
  return (
    <div className="space-y-5">
      {!shareLinksAvailable ? (
        <InlineMessage
          body="This role cannot manage recipient access in the current workspace."
          title="Recipient access unavailable"
          tone="warning"
        />
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
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
              loading={loadingWorkspace && shareLinksAvailable && !shareLinks.length}
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

        <div className="space-y-5">
          <PageSection
            description="Inspect the selected recipient contract before copying, handing off, or revoking it."
            title="Selected share link"
          >
            {selectedShareLink ? (
              <div className="space-y-5">
                <DetailList
                  items={[
                    { label: "Secret", value: selectedShareLink.secretName },
                    { label: "Secret key", value: selectedShareLink.secretKey },
                    { label: "Type", value: selectedShareLink.secretType },
                    {
                      label: "Permission",
                      value: (
                        <Badge tone={statusTone(selectedShareLink.permission)}>
                          {selectedShareLink.permission}
                        </Badge>
                      ),
                    },
                    {
                      label: "Status",
                      value: (
                        <Badge tone={statusTone(selectedShareLink.status)}>
                          {selectedShareLink.status}
                        </Badge>
                      ),
                    },
                    {
                      label: "Recipient",
                      value: selectedShareLink.recipientLabel || "Not specified",
                    },
                    {
                      label: "Vendor",
                      value: selectedShareLink.vendorName || "No linked vendor",
                    },
                    {
                      label: "Created",
                      value: formatInstant(selectedShareLink.createdAt),
                    },
                    {
                      label: "Expires",
                      value: formatInstant(selectedShareLink.expiresAt),
                    },
                    {
                      label: "Consumed at",
                      value: formatInstant(selectedShareLink.consumedAt),
                    },
                  ]}
                />

                <div className="flex flex-wrap gap-3">
                  {selectedShareLink.shareToken ? (
                    <Button
                      onClick={() => onCopySelectedToken(selectedShareLink.shareToken || "")}
                      type="button"
                      variant="secondary"
                    >
                      Copy token
                    </Button>
                  ) : null}
                  {selectedShareLinkAppUrl ? (
                    <Button
                      onClick={() => onCopySelectedAppUrl(selectedShareLinkAppUrl)}
                      type="button"
                      variant="secondary"
                    >
                      Copy recipient URL
                    </Button>
                  ) : null}
                  <Button
                    disabled={selectedShareLink.status !== "ACTIVE"}
                    onClick={onRevokeSelectedShareLink}
                    type="button"
                    variant="outline"
                  >
                    Revoke link
                  </Button>
                </div>
              </div>
            ) : (
              <EmptyState
                description="Select a share-link row to inspect the recipient contract and handoff state."
                title="No share link selected"
              />
            )}
          </PageSection>

          <PageSection
            description="The newest recipient package is staged here for vendor handoff."
            title="Latest recipient package"
          >
            {lastCreatedShare ? (
              <div className="space-y-4">
                <SharePreviewItem
                  label="Recipient app URL"
                  onCopy={() => void copyText(lastCreatedShare.appUrl, "Recipient URL")}
                  value={lastCreatedShare.appUrl}
                />
                <SharePreviewItem
                  label="Share token"
                  onCopy={() => void copyText(lastCreatedShare.token, "Share token")}
                  value={lastCreatedShare.token}
                />
              </div>
            ) : (
              <EmptyState
                description="Create a share link to populate the recipient package."
                title="No recipient package yet"
              />
            )}
          </PageSection>

          <PageSection
            description="Share links are public recipient contracts. They should be created only after the vault value is ready."
            title="Contract guidance"
          >
            <div className="space-y-3">
              <SurfaceNote
                label="VIEW_ONCE"
                value="Reveal succeeds once, then the link moves to consumed."
              />
              <SurfaceNote
                label="VIEW_UNTIL_REVOKED"
                value="Reveal remains available until the issuer revokes or expiry closes the contract."
              />
              <SurfaceNote
                label="ROTATION_NOTIFY_ONLY"
                value="Metadata can be inspected, but the raw secret should not be revealed."
              />
              <SurfaceNote
                label="Best handoff"
                value="Send the recipient app URL first. Share the token only through a trusted channel."
              />
              <SurfaceNote
                label="Selected context"
                value={
                  selectedShareLink
                    ? `${selectedShareLink.secretKey} is currently ${selectedShareLink.status.toLowerCase()}.`
                    : "Select a share link to review the live recipient contract."
                }
              />
            </div>
          </PageSection>
        </div>
      </div>
    </div>
  );
}
