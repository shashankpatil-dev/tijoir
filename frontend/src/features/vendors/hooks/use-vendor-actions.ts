import type { FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { RouterLike, ShowToast } from "@/features/dashboard/hooks/workspace.types";
import type { ContractPermission } from "@/features/share-links/types/share-links.types";
import {
  createVendor,
  createVendorContract,
  offboardVendor,
  revokeVendorContract,
} from "@/features/vendors/api/vendors.api";
import { invalidateVendorWorkspaceQueries } from "@/features/vendors/hooks/vendor-query-utils";
import type {
  VendorContractResponse,
  VendorResponse,
} from "@/features/vendors/types/vendors.types";

type VendorFormStateLike = {
  contractExpiry: string;
  contractPermission: string;
  contractRevokeTarget: VendorContractResponse | null;
  contractSecretId: string;
  setCreateContractOpen: (value: boolean) => void;
  setCreateVendorOpen: (value: boolean) => void;
  vendorContactEmail: string;
  vendorContactName: string;
  vendorName: string;
  vendorNotes: string;
  vendorOffboardTarget: VendorResponse | null;
};

export function useVendorActions({
  contractPage,
  contractStatusFilter,
  formState,
  handleSessionError,
  router,
  selectedVendor,
  sessionAccessToken,
  setActionBusy,
  setMessage,
  setSelectedVendorId,
  showToast,
  vendorPage,
  vendorSearch,
  vendorStatusFilter,
}: {
  contractPage: number;
  contractStatusFilter: string;
  formState: VendorFormStateLike;
  handleSessionError: (error: unknown, fallback: string) => void;
  router: RouterLike;
  selectedVendor: VendorResponse | null;
  sessionAccessToken?: string;
  setActionBusy: (value: string | null) => void;
  setMessage: (value: string) => void;
  setSelectedVendorId: (value: string) => void;
  showToast: ShowToast;
  vendorPage: number;
  vendorSearch: string;
  vendorStatusFilter: string;
}) {
  const queryClient = useQueryClient();

  const createVendorMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      contactName?: string | null;
      contactEmail?: string | null;
      notes?: string | null;
    }) => createVendor(sessionAccessToken as string, payload),
  });

  const createVendorContractMutation = useMutation({
    mutationFn: (payload: {
      vendorId: string;
      secretId: string;
      permission: ContractPermission;
      expiresAt?: string | null;
    }) =>
      createVendorContract(sessionAccessToken as string, payload.vendorId, {
        secretId: payload.secretId,
        permission: payload.permission,
        expiresAt: payload.expiresAt,
      }),
  });

  const revokeVendorContractMutation = useMutation({
    mutationFn: (payload: { vendorId: string; contractId: string }) =>
      revokeVendorContract(sessionAccessToken as string, payload.vendorId, payload.contractId),
  });

  const offboardVendorMutation = useMutation({
    mutationFn: (vendorId: string) => offboardVendor(sessionAccessToken as string, vendorId),
  });

  async function invalidate(vendorId?: string) {
    if (!sessionAccessToken) {
      return;
    }
    await invalidateVendorWorkspaceQueries({
      accessToken: sessionAccessToken,
      contractPage,
      contractStatusFilter,
      queryClient,
      vendorId,
      vendorPage,
      vendorSearch,
      vendorStatusFilter,
    });
  }

  async function handleCreateVendor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionAccessToken) {
      router.replace("/login");
      return;
    }

    setActionBusy("create-vendor");
    setMessage("Creating vendor");

    try {
      const created = await createVendorMutation.mutateAsync({
        name: formState.vendorName.trim(),
        contactName: formState.vendorContactName.trim() || null,
        contactEmail: formState.vendorContactEmail.trim() || null,
        notes: formState.vendorNotes.trim() || null,
      });
      formState.setCreateVendorOpen(false);
      setSelectedVendorId(created.id);
      router.push("/dashboard/vendors");
      await invalidate(created.id);
      setMessage(`Vendor ${created.name} created.`);
      showToast({
        title: "Vendor created",
        description: `${created.name} is ready for contract and share-link workflows.`,
        tone: "success",
      });
    } catch (error) {
      handleSessionError(error, "Could not create vendor");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleCreateVendorContract(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionAccessToken || !selectedVendor) {
      router.replace("/dashboard/vendors");
      return;
    }

    setActionBusy("create-vendor-contract");
    setMessage("Creating vendor contract");

    try {
      const created = await createVendorContractMutation.mutateAsync({
        vendorId: selectedVendor.id,
        secretId: formState.contractSecretId,
        permission: formState.contractPermission as ContractPermission,
        expiresAt: formState.contractExpiry
          ? new Date(formState.contractExpiry).toISOString()
          : null,
      });
      formState.setCreateContractOpen(false);
      await invalidate(selectedVendor.id);
      setMessage(`Contract created for ${created.secretKey}.`);
      showToast({
        title: "Contract created",
        description: `${selectedVendor.name} now has a contract for ${created.secretKey}.`,
        tone: "success",
      });
    } catch (error) {
      handleSessionError(error, "Could not create vendor contract");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleRevokeVendorContract() {
    if (!sessionAccessToken || !formState.contractRevokeTarget) {
      router.replace("/dashboard/vendors");
      return;
    }

    setActionBusy(`revoke-contract-${formState.contractRevokeTarget.id}`);
    setMessage("Revoking vendor contract");

    try {
      await revokeVendorContractMutation.mutateAsync({
        vendorId: formState.contractRevokeTarget.vendorId,
        contractId: formState.contractRevokeTarget.id,
      });
      await invalidate(formState.contractRevokeTarget.vendorId);
      setMessage("Vendor contract revoked.");
      showToast({
        title: "Contract revoked",
        description: "The vendor contract is no longer active.",
        tone: "warning",
      });
    } catch (error) {
      handleSessionError(error, "Could not revoke vendor contract");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleOffboardVendor() {
    if (!sessionAccessToken || !formState.vendorOffboardTarget) {
      router.replace("/dashboard/vendors");
      return;
    }

    setActionBusy(`offboard-vendor-${formState.vendorOffboardTarget.id}`);
    setMessage("Offboarding vendor");

    try {
      const result = await offboardVendorMutation.mutateAsync(formState.vendorOffboardTarget.id);
      await invalidate(formState.vendorOffboardTarget.id);
      setMessage(`Vendor ${result.vendorName} offboarded.`);
      showToast({
        title: "Vendor offboarded",
        description: `${result.revokedContracts} contracts and ${result.revokedShareLinks} share links were revoked.`,
        tone: "warning",
      });
    } catch (error) {
      handleSessionError(error, "Could not offboard vendor");
    } finally {
      setActionBusy(null);
    }
  }

  function openCreateVendor() {
    router.push("/dashboard/vendors");
    formState.setCreateVendorOpen(true);
  }

  function openCreateContract() {
    if (!selectedVendor) {
      setMessage("Select a vendor before creating a contract.");
      return;
    }
    router.push("/dashboard/vendors");
    formState.setCreateContractOpen(true);
  }

  return {
    handleCreateVendor,
    handleCreateVendorContract,
    handleOffboardVendor,
    handleRevokeVendorContract,
    openCreateContract,
    openCreateVendor,
  };
}
