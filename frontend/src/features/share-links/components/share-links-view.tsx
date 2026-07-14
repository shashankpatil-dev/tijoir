import { InlineMessage } from "@/components/ui/feedback";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  onCloseShareLink,
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
  onCloseShareLink: () => void;
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

      <Sheet
        open={Boolean(selectedShareLinkId) && Boolean(selectedShareLink)}
        onOpenChange={(open) => {
          if (!open) {
            onCloseShareLink();
          }
        }}
      >
        <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
          <SheetHeader className="border-b border-[var(--color-dashboard-border)]">
            <SheetTitle>Share link</SheetTitle>
            {selectedShareLink ? (
              <p className="text-sm text-[var(--color-muted)]">
                {selectedShareLink.secretName}
              </p>
            ) : null}
          </SheetHeader>

          <div className="p-4">
            {selectedShareLink ? (
              <SelectedShareLinkSection
                onCopySelectedAppUrl={onCopySelectedAppUrl}
                onCopySelectedToken={onCopySelectedToken}
                onRevokeSelectedShareLink={onRevokeSelectedShareLink}
                selectedShareLink={selectedShareLink}
                selectedShareLinkAppUrl={selectedShareLinkAppUrl}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
