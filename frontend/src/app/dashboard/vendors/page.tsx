"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useDashboardWorkspaceContext } from "@/features/dashboard/components/dashboard-workspace-context";
import { CreateVendorContractDialog } from "@/features/vendors/components/create-vendor-contract-dialog";
import { CreateVendorDialog } from "@/features/vendors/components/create-vendor-dialog";
import { VendorsView } from "@/features/vendors/components/vendors-view";
import { useVendorsWorkspace } from "@/features/vendors/hooks/use-vendors-workspace";
import { CONTRACT_PERMISSIONS } from "@/features/share-links/types/share-links.types";

export default function DashboardVendorsPage() {
  const shell = useDashboardWorkspaceContext();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendors = useVendorsWorkspace({
    handleSessionError: shell.handleSessionError,
    router: shell.router,
    sessionAccessToken: shell.session?.accessToken ?? undefined,
    setActionBusy: shell.setActionBusy,
    setMessage: shell.setMessage,
    showToast: shell.showToast,
  });

  useEffect(() => {
    if (searchParams.get("create") !== "1") {
      return;
    }

    vendors.setCreateVendorOpen(true);
    router.replace(pathname);
  }, [pathname, router, searchParams, vendors.setCreateVendorOpen]);

  return (
    <>
      <VendorsView
        contractColumns={vendors.contractColumns}
        contractPage={vendors.contractPage}
        contractPageCount={vendors.contractPageCount}
        contractStatusFilter={vendors.contractStatusFilter}
        contracts={vendors.paginatedVendorContracts}
        contractsLoading={vendors.contractsLoading}
        contractsTotal={vendors.contractsTotal}
        loadingWorkspace={vendors.loadingVendors}
        onCloseVendor={() => vendors.setSelectedVendorId("")}
        onCreateContract={vendors.openCreateContract}
        onCreateVendor={() => vendors.setCreateVendorOpen(true)}
        onOffboardVendor={() => {
          if (vendors.selectedVendor) {
            vendors.setVendorOffboardTarget(vendors.selectedVendor);
          }
        }}
        selectedVendor={vendors.selectedVendor}
        setContractPage={vendors.setContractPage}
        setContractStatusFilter={vendors.setContractStatusFilter}
        setSelectedVendorId={vendors.setSelectedVendorId}
        setVendorPage={vendors.setVendorPage}
        setVendorSearch={vendors.setVendorSearch}
        setVendorStatusFilter={vendors.setVendorStatusFilter}
        vendorColumns={vendors.vendorColumns}
        vendorPage={vendors.vendorPage}
        vendorPageCount={vendors.vendorPageCount}
        vendorSearch={vendors.vendorSearch}
        vendorStatusFilter={vendors.vendorStatusFilter}
        vendors={vendors.paginatedVendors}
        vendorsAvailable={vendors.vendorsAvailable}
        vendorsTotal={vendors.vendorsTotal}
      />

      <CreateVendorDialog
        actionBusy={shell.actionBusy}
        contactEmail={vendors.vendorContactEmail}
        contactName={vendors.vendorContactName}
        name={vendors.vendorName}
        notes={vendors.vendorNotes}
        onClose={() => vendors.setCreateVendorOpen(false)}
        onSubmit={vendors.handleCreateVendor}
        open={vendors.createVendorOpen}
        setContactEmail={vendors.setVendorContactEmail}
        setContactName={vendors.setVendorContactName}
        setName={vendors.setVendorName}
        setNotes={vendors.setVendorNotes}
      />

      <CreateVendorContractDialog
        actionBusy={shell.actionBusy}
        contractExpiry={vendors.contractExpiry}
        contractPermission={vendors.contractPermission}
        contractPermissions={CONTRACT_PERMISSIONS}
        contractSecretId={vendors.contractSecretId}
        onClose={() => vendors.setCreateContractOpen(false)}
        onSubmit={vendors.handleCreateVendorContract}
        open={vendors.createContractOpen}
        secrets={vendors.secretOptions}
        selectedVendor={vendors.selectedVendor}
        setContractExpiry={vendors.setContractExpiry}
        setContractPermission={vendors.setContractPermission}
        setContractSecretId={vendors.setContractSecretId}
      />

      <ConfirmDialog
        confirmLabel="Revoke contract"
        description={
          vendors.contractRevokeTarget
            ? `Revoke the contract for ${vendors.contractRevokeTarget.secretKey}. Future vendor-linked access should stop immediately.`
            : ""
        }
        onClose={() => vendors.setContractRevokeTarget(null)}
        onConfirm={() => {
          if (vendors.contractRevokeTarget) {
            void vendors.handleRevokeVendorContract();
          }
          vendors.setContractRevokeTarget(null);
        }}
        open={Boolean(vendors.contractRevokeTarget)}
        title="Revoke vendor contract"
      />

      <ConfirmDialog
        confirmLabel="Offboard vendor"
        description={
          vendors.vendorOffboardTarget
            ? `Offboard ${vendors.vendorOffboardTarget.name}. Active contracts and vendor-linked share links should be revoked.`
            : ""
        }
        onClose={() => vendors.setVendorOffboardTarget(null)}
        onConfirm={() => {
          if (vendors.vendorOffboardTarget) {
            void vendors.handleOffboardVendor();
          }
          vendors.setVendorOffboardTarget(null);
        }}
        open={Boolean(vendors.vendorOffboardTarget)}
        title="Offboard vendor"
      />
    </>
  );
}
