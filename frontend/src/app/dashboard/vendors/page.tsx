"use client";

import { useDashboardWorkspaceContext } from "@/features/dashboard/components/dashboard-workspace-context";
import { VendorsView } from "@/features/vendors/components/vendors-view";

export default function DashboardVendorsPage() {
  const workspace = useDashboardWorkspaceContext();

  return (
    <VendorsView
      contractColumns={workspace.contractColumns}
      contractPage={workspace.contractPage}
      contractPageCount={workspace.contractPageCount}
      contractStatusFilter={workspace.contractStatusFilter}
      contracts={workspace.paginatedVendorContracts}
      contractsLoading={workspace.contractsLoading}
      contractsTotal={workspace.contractsTotal}
      loadingWorkspace={workspace.loadingWorkspace}
      onCreateContract={workspace.openCreateContract}
      onCreateVendor={workspace.openCreateVendor}
      onOffboardVendor={() => {
        if (workspace.selectedVendor) {
          workspace.setVendorOffboardTarget(workspace.selectedVendor);
        }
      }}
      selectedVendor={workspace.selectedVendor}
      setContractPage={workspace.setContractPage}
      setContractStatusFilter={workspace.setContractStatusFilter}
      setSelectedVendorId={workspace.setSelectedVendorId}
      setVendorPage={workspace.setVendorPage}
      setVendorSearch={workspace.setVendorSearch}
      setVendorStatusFilter={workspace.setVendorStatusFilter}
      vendorColumns={workspace.vendorColumns}
      vendorPage={workspace.vendorPage}
      vendorPageCount={workspace.vendorPageCount}
      vendorSearch={workspace.vendorSearch}
      vendorStatusFilter={workspace.vendorStatusFilter}
      vendors={workspace.paginatedVendors}
      vendorsAvailable={workspace.vendorsAvailable}
      vendorsTotal={workspace.vendorsTotal}
    />
  );
}
