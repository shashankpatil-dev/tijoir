import { InlineMessage } from "@/components/ui/feedback";
import type { DataTableColumn } from "@/components/ui/data-table";
import { ShareLinkInventorySection } from "@/features/share-links/components/share-link-inventory-section";
import { SelectedShareLinkSection } from "@/features/share-links/components/selected-share-link-section";
import type {
  ContractPermission,
  ShareLinkResponse,
} from "@/features/share-links/types/share-links.types";

export function ShareLinksView({
  contractPermissions,
  filteredShareLinksLength,
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
  filteredShareLinksLength: number;
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
        <ShareLinkInventorySection
          contractPermissions={contractPermissions}
          filteredShareLinksLength={filteredShareLinksLength}
          loadingWorkspace={loadingWorkspace}
          onCreateShareLink={onCreateShareLink}
          paginatedShareLinks={paginatedShareLinks}
          selectedShareLinkId={selectedShareLinkId}
          setSelectedShareLinkId={setSelectedShareLinkId}
          setSharePage={setSharePage}
          setSharePermissionFilter={setSharePermissionFilter}
          setShareSearch={setShareSearch}
          setShareStatusFilter={setShareStatusFilter}
          shareColumns={shareColumns}
          shareLinks={shareLinks}
          sharePage={sharePage}
          sharePageCount={sharePageCount}
          sharePermissionFilter={sharePermissionFilter}
          shareSearch={shareSearch}
          shareStatusFilter={shareStatusFilter}
          shareTotal={shareTotal}
        />

        <div className="space-y-5">
          <SelectedShareLinkSection
            onCopySelectedAppUrl={onCopySelectedAppUrl}
            onCopySelectedToken={onCopySelectedToken}
            onRevokeSelectedShareLink={onRevokeSelectedShareLink}
            selectedShareLink={selectedShareLink}
            selectedShareLinkAppUrl={selectedShareLinkAppUrl}
          />
        </div>
      </div>
    </div>
  );
}
