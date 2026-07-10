import {
  DetailList,
  EmptyState,
  PageSection,
} from "@/components/dashboard/dashboard-shell";
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
  VendorContractResponse,
  VendorResponse,
} from "@/features/vendors/types/vendors.types";

export function VendorsView({
  contractColumns,
  contractPage,
  contractPageCount,
  contractStatusFilter,
  contracts,
  contractsLoading,
  contractsTotal,
  loadingWorkspace,
  onCreateContract,
  onCreateVendor,
  onOffboardVendor,
  selectedVendor,
  setContractPage,
  setContractStatusFilter,
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
  contractPage: number;
  contractPageCount: number;
  contractStatusFilter: string;
  contracts: VendorContractResponse[];
  contractsLoading: boolean;
  contractsTotal: number;
  loadingWorkspace: boolean;
  onCreateContract: () => void;
  onCreateVendor: () => void;
  onOffboardVendor: () => void;
  selectedVendor: VendorResponse | null;
  setContractPage: (page: number) => void;
  setContractStatusFilter: (value: string) => void;
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
  return (
    <div className="space-y-5">
      {!vendorsAvailable ? (
        <InlineMessage
          body="This role cannot manage vendor relationships in the current workspace."
          title="Vendor access unavailable"
          tone="warning"
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <PageSection title="Vendors">
              <div className="space-y-4">
                <TableToolbar
                  actions={
                    <Button onClick={onCreateVendor} type="button">
                      Create vendor
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
                  containerClassName="max-h-[30rem]"
                  columns={vendorColumns}
                  data={vendors}
                  emptyDescription="Create the first vendor to bind contracts and external share flows to a real entity."
                  emptyTitle="No vendors match the current filters"
                  loading={loadingWorkspace && vendorsAvailable && !vendors.length}
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

            <PageSection title="Vendor contracts">
              {selectedVendor ? (
                <div className="space-y-4">
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
                        { label: "Active", value: "ACTIVE" },
                        { label: "Revoked", value: "REVOKED" },
                        { label: "Expired", value: "EXPIRED" },
                      ]}
                      value={contractStatusFilter}
                    />
                  </TableToolbar>

                  <DataTable
                    containerClassName="max-h-[24rem]"
                    columns={contractColumns}
                    data={contracts}
                    emptyDescription="This vendor does not have contract records for the current filters."
                    emptyTitle="No contracts to show"
                    loading={contractsLoading || (loadingWorkspace && !contracts.length)}
                    rowKey={(contract) => contract.id}
                  />

                  <PaginationControls
                    currentPage={contractPage}
                    itemLabel="contracts"
                    onPageChange={setContractPage}
                    pageCount={contractPageCount}
                    totalItems={contractsTotal}
                  />
                </div>
              ) : (
                <EmptyState
                  description="Pick a vendor from the registry to manage its contracts."
                  title="No vendor selected"
                />
              )}
            </PageSection>
          </div>

          <div className="space-y-5">
            <PageSection title="Vendor profile">
              {selectedVendor ? (
                <div className="space-y-4">
                  <DetailList
                    items={[
                      { label: "Vendor", value: selectedVendor.name },
                      {
                        label: "Contact",
                        value: selectedVendor.contactName || "Not specified",
                      },
                      {
                        label: "Contact email",
                        value: selectedVendor.contactEmail || "Not specified",
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
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm leading-6 text-[var(--color-ink)]">
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
                </div>
              ) : (
                <EmptyState
                  description="Select a vendor to inspect contact details, notes, and offboarding controls."
                  title="No vendor profile selected"
                />
              )}
            </PageSection>
          </div>
        </div>
      )}
    </div>
  );
}
