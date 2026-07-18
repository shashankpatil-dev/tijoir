"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useDashboardWorkspaceContext } from "@/features/dashboard/components/dashboard-workspace-context";
import { CreateVendorContractDialog } from "@/features/vendors/components/create-vendor-contract-dialog";
import { CreateVendorContractGrantDialog } from "@/features/vendors/components/create-vendor-contract-grant-dialog";
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
        incomingContractColumns={vendors.incomingContractColumns}
        incomingContractPage={vendors.incomingContractPage}
        incomingContractPageCount={vendors.incomingContractPageCount}
        incomingContractStatusFilter={vendors.incomingContractStatusFilter}
        incomingContracts={vendors.paginatedIncomingContracts}
        incomingContractsLoading={vendors.incomingContractsLoading}
        incomingContractsTotal={vendors.incomingContractsTotal}
        grantColumns={vendors.grantColumns}
        contractPage={vendors.contractPage}
        contractPageCount={vendors.contractPageCount}
        contractStatusFilter={vendors.contractStatusFilter}
        contracts={vendors.paginatedVendorContracts}
        contractsLoading={vendors.contractsLoading}
        contractsTotal={vendors.contractsTotal}
        contractShareActivity={vendors.contractShareActivity}
        shareActivityColumns={vendors.shareActivityColumns}
        shareActivityLoading={vendors.shareActivityLoading}
        shareActivityPage={vendors.shareActivityPage}
        shareActivityPageCount={vendors.shareActivityPageCount}
        shareActivityStatusFilter={vendors.shareActivityStatusFilter}
        shareActivityTotal={vendors.shareActivityTotal}
        grantPage={vendors.grantPage}
        grantPageCount={vendors.grantPageCount}
        grantStatusFilter={vendors.grantStatusFilter}
        grants={vendors.paginatedVendorGrants}
        grantsLoading={vendors.grantsLoading}
        grantsTotal={vendors.grantsTotal}
        loadingWorkspace={vendors.loadingVendors}
        onCloseVendor={() => vendors.setSelectedVendorId("")}
        onCreateContract={vendors.openCreateContract}
        onCreateGrant={vendors.openCreateGrant}
        onCreateVendor={() => vendors.setCreateVendorOpen(true)}
        onOffboardVendor={() => {
          if (vendors.selectedVendor) {
            vendors.setVendorOffboardTarget(vendors.selectedVendor);
          }
        }}
        selectedContract={vendors.selectedContract}
        selectedVendor={vendors.selectedVendor}
        setContractPage={vendors.setContractPage}
        setContractStatusFilter={vendors.setContractStatusFilter}
        setIncomingContractPage={vendors.setIncomingContractPage}
        setIncomingContractStatusFilter={vendors.setIncomingContractStatusFilter}
        setGrantPage={vendors.setGrantPage}
        setGrantStatusFilter={vendors.setGrantStatusFilter}
        setShareActivityPage={vendors.setShareActivityPage}
        setShareActivityStatusFilter={vendors.setShareActivityStatusFilter}
        setSelectedContractId={vendors.setSelectedContractId}
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
        linkedOrganizationSlug={vendors.linkedOrganizationSlug}
        name={vendors.vendorName}
        notes={vendors.vendorNotes}
        onClose={() => vendors.setCreateVendorOpen(false)}
        onSubmit={vendors.handleCreateVendor}
        open={vendors.createVendorOpen}
        setContactEmail={vendors.setVendorContactEmail}
        setContactName={vendors.setVendorContactName}
        setLinkedOrganizationSlug={vendors.setLinkedOrganizationSlug}
        setName={vendors.setVendorName}
        setNotes={vendors.setVendorNotes}
      />

      <CreateVendorContractDialog
        actionBusy={shell.actionBusy}
        contractExpiry={vendors.contractExpiry}
        contractPermission={vendors.contractPermission}
        contractPermissions={CONTRACT_PERMISSIONS}
        onClose={() => vendors.setCreateContractOpen(false)}
        onSubmit={vendors.handleCreateVendorContract}
        open={vendors.createContractOpen}
        selectedVendor={vendors.selectedVendor}
        setContractExpiry={vendors.setContractExpiry}
        setContractPermission={vendors.setContractPermission}
      />

      <CreateVendorContractGrantDialog
        actionBusy={shell.actionBusy}
        grantExpiry={vendors.grantExpiry}
        grantPermission={vendors.grantPermission}
        grantPermissions={CONTRACT_PERMISSIONS}
        grantSecretId={vendors.grantSecretId}
        onClose={() => vendors.setCreateGrantOpen(false)}
        onSubmit={vendors.handleCreateVendorContractGrant}
        open={vendors.createGrantOpen}
        secrets={vendors.secretOptions}
        selectedContract={vendors.selectedContract}
        setGrantExpiry={vendors.setGrantExpiry}
        setGrantPermission={vendors.setGrantPermission}
        setGrantSecretId={vendors.setGrantSecretId}
      />

      <ConfirmDialog
        confirmLabel="Revoke contract"
        description={
          vendors.contractRevokeTarget
            ? `Revoke the contract boundary for ${vendors.contractRevokeTarget.vendorName}. Future vendor-linked access should stop immediately.`
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

      <ConfirmDialog
        confirmLabel="Revoke grant"
        description={
          vendors.grantRevokeTarget
            ? `Revoke the secret grant for ${vendors.grantRevokeTarget.secretKey}. Future vendor delivery under this grant should stop immediately.`
            : ""
        }
        onClose={() => vendors.setGrantRevokeTarget(null)}
        onConfirm={() => {
          if (vendors.grantRevokeTarget) {
            void vendors.handleRevokeVendorContractGrant();
          }
          vendors.setGrantRevokeTarget(null);
        }}
        open={Boolean(vendors.grantRevokeTarget)}
        title="Revoke secret grant"
      />

      <ConfirmDialog
        confirmLabel="Revoke link"
        description={
          vendors.shareRevokeTarget
            ? `Revoke the share delivery for ${vendors.shareRevokeTarget.secretKey}. Recipient access from this contract activity item should stop immediately.`
            : ""
        }
        onClose={() => vendors.setShareRevokeTarget(null)}
        onConfirm={() => {
          if (vendors.shareRevokeTarget) {
            void vendors.handleRevokeShareActivityLink();
          }
          vendors.setShareRevokeTarget(null);
        }}
        open={Boolean(vendors.shareRevokeTarget)}
        title="Revoke contract share link"
      />
    </>
  );
}
