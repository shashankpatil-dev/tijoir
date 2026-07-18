import {
  DefinitionRows,
  EmptyState,
  PageSection,
} from "@/components/dashboard/dashboard-shell";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { InlineMessage } from "@/components/ui/feedback";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FilterSelect,
  PaginationControls,
  SearchInput,
  TableToolbar,
} from "@/components/ui/table-controls";
import type { ShareLinkResponse } from "@/features/share-links/types/share-links.types";
import type {
  IncomingVendorContractResponse,
  VendorContractResponse,
  VendorContractGrantResponse,
  VendorResponse,
} from "@/features/vendors/types/vendors.types";

export function VendorsView({
  contractColumns,
  incomingContractColumns,
  incomingContractPage,
  incomingContractPageCount,
  incomingGrantPage,
  incomingGrantPageCount,
  incomingGrantColumns,
  incomingGrants,
  incomingGrantsLoading,
  incomingGrantsTotal,
  incomingGrantStatusFilter,
  incomingContractStatusFilter,
  incomingContracts,
  incomingContractsLoading,
  incomingContractsTotal,
  grantColumns,
  contractPage,
  contractPageCount,
  contractStatusFilter,
  contracts,
  contractsLoading,
  contractsTotal,
  contractShareActivity,
  grantPage,
  grantPageCount,
  grantStatusFilter,
  grants,
  grantsLoading,
  grantsTotal,
  loadingWorkspace,
  onCloseVendor,
  onCreateContract,
  onCreateGrant,
  onCreateVendor,
  onOffboardVendor,
  selectedIncomingContract,
  shareActivityColumns,
  shareActivityLoading,
  shareActivityPage,
  shareActivityPageCount,
  shareActivityStatusFilter,
  shareActivityTotal,
  selectedContract,
  selectedVendor,
  setContractPage,
  setContractStatusFilter,
  setIncomingContractPage,
  setIncomingGrantPage,
  setIncomingGrantStatusFilter,
  setIncomingContractStatusFilter,
  setSelectedIncomingContractId,
  setGrantPage,
  setGrantStatusFilter,
  setShareActivityPage,
  setShareActivityStatusFilter,
  setSelectedContractId,
  setSelectedVendorId,
  setVendorPage,
  setVendorSearch,
  setVendorStatusFilter,
  vendorColumns,
  vendorPage,
  vendorPageCount,
  vendorSearch,
  vendorStatusFilter,
  vendors,
  vendorsAvailable,
  vendorsTotal,
}: {
  contractColumns: DataTableColumn<VendorContractResponse>[];
  incomingContractColumns: DataTableColumn<IncomingVendorContractResponse>[];
  incomingContractPage: number;
  incomingContractPageCount: number;
  incomingGrantPage: number;
  incomingGrantPageCount: number;
  incomingGrantColumns: DataTableColumn<VendorContractGrantResponse>[];
  incomingGrants: VendorContractGrantResponse[];
  incomingGrantsLoading: boolean;
  incomingGrantsTotal: number;
  incomingGrantStatusFilter: string;
  incomingContractStatusFilter: string;
  incomingContracts: IncomingVendorContractResponse[];
  incomingContractsLoading: boolean;
  incomingContractsTotal: number;
  grantColumns: DataTableColumn<VendorContractGrantResponse>[];
  contractPage: number;
  contractPageCount: number;
  contractStatusFilter: string;
  contracts: VendorContractResponse[];
  contractsLoading: boolean;
  contractsTotal: number;
  contractShareActivity: ShareLinkResponse[];
  grantPage: number;
  grantPageCount: number;
  grantStatusFilter: string;
  grants: VendorContractGrantResponse[];
  grantsLoading: boolean;
  grantsTotal: number;
  loadingWorkspace: boolean;
  onCloseVendor: () => void;
  onCreateContract: () => void;
  onCreateGrant: () => void;
  onCreateVendor: () => void;
  onOffboardVendor: () => void;
  selectedIncomingContract: IncomingVendorContractResponse | null;
  shareActivityColumns: DataTableColumn<ShareLinkResponse>[];
  shareActivityLoading: boolean;
  shareActivityPage: number;
  shareActivityPageCount: number;
  shareActivityStatusFilter: string;
  shareActivityTotal: number;
  selectedContract: VendorContractResponse | null;
  selectedVendor: VendorResponse | null;
  setContractPage: (page: number) => void;
  setContractStatusFilter: (value: string) => void;
  setIncomingContractPage: (page: number) => void;
  setIncomingGrantPage: (page: number) => void;
  setIncomingGrantStatusFilter: (value: string) => void;
  setIncomingContractStatusFilter: (value: string) => void;
  setSelectedIncomingContractId: (value: string) => void;
  setGrantPage: (page: number) => void;
  setGrantStatusFilter: (value: string) => void;
  setShareActivityPage: (page: number) => void;
  setShareActivityStatusFilter: (value: string) => void;
  setSelectedContractId: (value: string) => void;
  setSelectedVendorId: (value: string) => void;
  setVendorPage: (page: number) => void;
  setVendorSearch: (value: string) => void;
  setVendorStatusFilter: (value: string) => void;
  vendorColumns: DataTableColumn<VendorResponse>[];
  vendorPage: number;
  vendorPageCount: number;
  vendorSearch: string;
  vendorStatusFilter: string;
  vendors: VendorResponse[];
  vendorsAvailable: boolean;
  vendorsTotal: number;
}) {
  if (!vendorsAvailable) {
    return (
      <InlineMessage
        body="This role cannot manage vendor relationships in the current workspace."
        title="Vendor access unavailable"
        tone="warning"
      />
    );
  }

  return (
    <>
      <PageSection title="Incoming contract proposals">
        <div className="space-y-4">
          <TableToolbar>
            <FilterSelect
              onChange={setIncomingContractStatusFilter}
              options={[
                { label: "All statuses", value: "ALL" },
                { label: "Proposed", value: "PROPOSED" },
                { label: "Active", value: "ACTIVE" },
                { label: "Rejected", value: "REJECTED" },
                { label: "Revoked", value: "REVOKED" },
                { label: "Expired", value: "EXPIRED" },
              ]}
              value={incomingContractStatusFilter}
            />
          </TableToolbar>

          <DataTable
            columns={incomingContractColumns}
            data={incomingContracts}
            emptyDescription="Linked vendor proposals from other organizations appear here for counterparty review."
            emptyTitle="No incoming proposals to show"
            loading={incomingContractsLoading}
            onRowClick={(contract) => setSelectedIncomingContractId(contract.id)}
            rowKey={(contract) => contract.id}
            selectedRowKey={selectedIncomingContract?.id ?? null}
          />

          <PaginationControls
            currentPage={incomingContractPage}
            itemLabel="incoming contracts"
            onPageChange={setIncomingContractPage}
            pageCount={incomingContractPageCount}
            totalItems={incomingContractsTotal}
          />

          {selectedIncomingContract ? (
            <div className="space-y-4 rounded-2xl border border-border bg-(--color-surface) p-4">
              <div>
                <p className="text-sm font-semibold text-(--color-ink-strong)">
                  Counterparty contract access
                </p>
                <p className="text-sm text-muted">
                  Review the contract boundary and the grants your organization can operate under.
                </p>
              </div>

              <DefinitionRows
                items={[
                  { label: "Owner organization", value: selectedIncomingContract.ownerOrganizationName },
                  { label: "Vendor record", value: selectedIncomingContract.vendorName },
                  { label: "Permission", value: selectedIncomingContract.permission },
                  { label: "Status", value: selectedIncomingContract.status },
                  {
                    label: "Accepted at",
                    value: selectedIncomingContract.counterpartyAcceptedAt || "Not accepted yet",
                  },
                  { label: "Expires at", value: selectedIncomingContract.expiresAt || "No expiry" },
                ]}
              />

              {selectedIncomingContract.status === "PROPOSED" ? (
                <InlineMessage
                  body="Accept this proposal to activate collaboration. No secret grants will appear until the contract is active."
                  title="Pending your organization review"
                  tone="warning"
                />
              ) : null}

              {selectedIncomingContract.status === "REJECTED" ? (
                <InlineMessage
                  body="This proposal has been closed. The owner organization must issue a fresh contract if collaboration should continue."
                  title="Proposal rejected"
                  tone="warning"
                />
              ) : null}

              <FilterSelect
                onChange={setIncomingGrantStatusFilter}
                options={[
                  { label: "All grant statuses", value: "ALL" },
                  { label: "Active", value: "ACTIVE" },
                  { label: "Revoked", value: "REVOKED" },
                  { label: "Expired", value: "EXPIRED" },
                ]}
                value={incomingGrantStatusFilter}
              />

              <DataTable
                columns={incomingGrantColumns}
                data={incomingGrants}
                emptyDescription="Grant inventory becomes visible here after the owner organization attaches secrets to this contract."
                emptyTitle="No grants available yet"
                loading={incomingGrantsLoading}
                rowKey={(grant) => grant.id}
              />

              <PaginationControls
                currentPage={incomingGrantPage}
                itemLabel="incoming grants"
                onPageChange={setIncomingGrantPage}
                pageCount={incomingGrantPageCount}
                totalItems={incomingGrantsTotal}
              />
            </div>
          ) : null}
        </div>
      </PageSection>

      <PageSection title="Vendors">
        <div className="space-y-4">
          <TableToolbar
            actions={
              <Button onClick={onCreateVendor} type="button">
                Add vendor
              </Button>
            }
          >
            <SearchInput
              onChange={setVendorSearch}
              placeholder="Search by vendor name or contact"
              value={vendorSearch}
            />
            <FilterSelect
              onChange={setVendorStatusFilter}
              options={[
                { label: "All statuses", value: "ALL" },
                { label: "Active", value: "ACTIVE" },
                { label: "Offboarded", value: "OFFBOARDED" },
              ]}
              value={vendorStatusFilter}
            />
          </TableToolbar>

          <DataTable
            columns={vendorColumns}
            data={vendors}
            emptyDescription="Add the first vendor to bind contracts and external share flows to a real entity."
            emptyTitle="No vendors match the current filters"
            loading={loadingWorkspace && !vendors.length}
            onRowClick={(vendor) => setSelectedVendorId(vendor.id)}
            rowKey={(vendor) => vendor.id}
            selectedRowKey={selectedVendor?.id ?? null}
          />

          <PaginationControls
            currentPage={vendorPage}
            itemLabel="vendors"
            onPageChange={setVendorPage}
            pageCount={vendorPageCount}
            totalItems={vendorsTotal}
          />
        </div>
      </PageSection>

      <Sheet
        open={Boolean(selectedVendor)}
        onOpenChange={(open) => {
          if (!open) {
            onCloseVendor();
          }
        }}
      >
        <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-xl">
          <SheetHeader className="border-b border-[var(--color-dashboard-border)]">
            <SheetTitle className="flex items-center gap-3">
              {selectedVendor?.name ?? "Vendor"}
              {selectedVendor ? (
                <Badge tone={statusTone(selectedVendor.status)}>
                  {selectedVendor.status}
                </Badge>
              ) : null}
            </SheetTitle>
          </SheetHeader>

          {selectedVendor ? (
            <Tabs className="gap-0" defaultValue="profile">
              <TabsList className="mx-4 mt-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="contracts">Contracts</TabsTrigger>
              </TabsList>

              <TabsContent className="space-y-5 p-4" value="profile">
                <DefinitionRows
                  items={[
                    {
                      label: "Contact",
                      value: selectedVendor.contactName || "Not specified",
                    },
                    {
                      label: "Contact email",
                      value: selectedVendor.contactEmail || "Not specified",
                    },
                    {
                      label: "Linked organization",
                      value:
                        selectedVendor.linkedOrganizationName ||
                        selectedVendor.linkedOrganizationSlug ||
                        "Not linked",
                    },
                    { label: "Status", value: selectedVendor.status },
                    { label: "Created by", value: selectedVendor.createdByName },
                    {
                      label: "Offboarded at",
                      value: selectedVendor.offboardedAt || "Active",
                    },
                  ]}
                />
                {selectedVendor.notes ? (
                  <div className="rounded-2xl border border-border bg-(--color-surface) p-4 text-sm leading-6 text-(--color-ink)">
                    {selectedVendor.notes}
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  <Button
                    disabled={selectedVendor.status !== "ACTIVE"}
                    onClick={onCreateContract}
                    type="button"
                    variant="secondary"
                  >
                    New contract
                  </Button>
                  <Button
                    disabled={selectedVendor.status !== "ACTIVE"}
                    onClick={onOffboardVendor}
                    type="button"
                    variant="danger"
                  >
                    Offboard vendor
                  </Button>
                </div>
              </TabsContent>

              <TabsContent className="space-y-4 p-4" value="contracts">
                <TableToolbar
                  actions={
                    <Button
                      disabled={selectedVendor.status !== "ACTIVE"}
                      onClick={onCreateContract}
                      type="button"
                    >
                      Create contract
                    </Button>
                  }
                >
                  <FilterSelect
                    onChange={setContractStatusFilter}
                    options={[
                      { label: "All statuses", value: "ALL" },
                      { label: "Proposed", value: "PROPOSED" },
                      { label: "Active", value: "ACTIVE" },
                      { label: "Rejected", value: "REJECTED" },
                      { label: "Revoked", value: "REVOKED" },
                      { label: "Expired", value: "EXPIRED" },
                    ]}
                    value={contractStatusFilter}
                  />
                </TableToolbar>

                <DataTable
                  columns={contractColumns}
                  data={contracts}
                  emptyDescription="This vendor does not have contract records for the current filters."
                  emptyTitle="No contracts to show"
                  loading={contractsLoading || (loadingWorkspace && !contracts.length)}
                  onRowClick={(contract) => setSelectedContractId(contract.id)}
                  rowKey={(contract) => contract.id}
                  selectedRowKey={selectedContract?.id ?? null}
                />

                <PaginationControls
                  currentPage={contractPage}
                  itemLabel="contracts"
                  onPageChange={setContractPage}
                  pageCount={contractPageCount}
                  totalItems={contractsTotal}
                />

                {selectedContract ? (
                  <div className="space-y-4 rounded-2xl border border-border bg-(--color-surface) p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-(--color-ink-strong)">
                          Secret grants
                        </p>
                        <p className="text-sm text-muted">
                          Attach one or more secrets to the selected contract boundary.
                        </p>
                      </div>
                      <Button
                        disabled={
                          selectedVendor.status !== "ACTIVE"
                          || selectedContract.status !== "ACTIVE"
                        }
                        onClick={onCreateGrant}
                        type="button"
                      >
                        Create grant
                      </Button>
                    </div>

                    {selectedContract.status === "PROPOSED" ? (
                      <InlineMessage
                        body="This contract is still waiting for counterparty acceptance. Secret grants and vendor delivery remain blocked until it becomes active."
                        title="Counterparty acceptance required"
                        tone="warning"
                      />
                    ) : null}

                    {selectedContract.status === "REJECTED" ? (
                      <InlineMessage
                        body="The counterparty rejected this proposal. Create a fresh contract proposal if the vendor relationship should continue."
                        title="Proposal rejected"
                        tone="warning"
                      />
                    ) : null}

                    <FilterSelect
                      onChange={setGrantStatusFilter}
                      options={[
                        { label: "All statuses", value: "ALL" },
                        { label: "Active", value: "ACTIVE" },
                        { label: "Revoked", value: "REVOKED" },
                        { label: "Expired", value: "EXPIRED" },
                      ]}
                      value={grantStatusFilter}
                    />

                    <DataTable
                      columns={grantColumns}
                      data={grants}
                      emptyDescription="This contract does not have secret grants for the current filters."
                      emptyTitle="No grants to show"
                      loading={grantsLoading || (loadingWorkspace && !grants.length)}
                      rowKey={(grant) => grant.id}
                    />

                    <PaginationControls
                      currentPage={grantPage}
                      itemLabel="grants"
                      onPageChange={setGrantPage}
                      pageCount={grantPageCount}
                      totalItems={grantsTotal}
                    />

                    <div className="space-y-4 rounded-2xl border border-border bg-white p-4">
                      <div>
                        <p className="text-sm font-semibold text-(--color-ink-strong)">
                          Share activity
                        </p>
                        <p className="text-sm text-muted">
                          Track recipient delivery created under the selected contract.
                        </p>
                      </div>

                      <FilterSelect
                        onChange={setShareActivityStatusFilter}
                        options={[
                          { label: "All statuses", value: "ALL" },
                          { label: "Active", value: "ACTIVE" },
                          { label: "Consumed", value: "CONSUMED" },
                          { label: "Revoked", value: "REVOKED" },
                          { label: "Expired", value: "EXPIRED" },
                        ]}
                        value={shareActivityStatusFilter}
                      />

                      <DataTable
                        columns={shareActivityColumns}
                        data={contractShareActivity}
                        emptyDescription="No delivery activity exists for the selected contract and filters."
                        emptyTitle="No share activity to show"
                        loading={shareActivityLoading || (loadingWorkspace && !contractShareActivity.length)}
                        rowKey={(shareLink) => shareLink.id}
                      />

                      <PaginationControls
                        currentPage={shareActivityPage}
                        itemLabel="share links"
                        onPageChange={setShareActivityPage}
                        pageCount={shareActivityPageCount}
                        totalItems={shareActivityTotal}
                      />
                    </div>
                  </div>
                ) : null}
              </TabsContent>
            </Tabs>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
