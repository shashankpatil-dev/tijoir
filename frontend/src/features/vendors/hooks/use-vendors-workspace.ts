import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  buildVendorColumns,
  buildVendorContractColumns,
} from "@/features/dashboard/lib/dashboard-columns";
import { DASHBOARD_ITEMS_PER_PAGE, pageCount } from "@/features/dashboard/lib/dashboard-pagination";
import { dashboardQueryKeys } from "@/features/dashboard/lib/query-keys";
import type { RouterLike, ShowToast } from "@/features/dashboard/hooks/workspace.types";
import type { SecretSummary } from "@/features/secrets/types/secrets.types";
import type { ContractPermission } from "@/features/share-links/types/share-links.types";
import {
  createVendor,
  createVendorContract,
  fetchVendorContractsPage,
  fetchVendorsPage,
  offboardVendor,
  revokeVendorContract,
} from "@/features/vendors/api/vendors.api";
import { useVendorFormState } from "@/features/vendors/hooks/use-vendor-form-state";
import type {
  VendorContractResponse,
  VendorResponse,
} from "@/features/vendors/types/vendors.types";
import type { DataTableColumn } from "@/components/ui/data-table";

export function useVendorsWorkspace({
  handleSessionError,
  router,
  secrets,
  sessionAccessToken,
  setActionBusy,
  setMessage,
  showToast,
  vendors,
}: {
  handleSessionError: (error: unknown, fallback: string) => void;
  router: RouterLike;
  secrets: SecretSummary[];
  sessionAccessToken?: string;
  setActionBusy: (value: string | null) => void;
  setMessage: (value: string) => void;
  showToast: ShowToast;
  vendors: VendorResponse[];
}) {
  const queryClient = useQueryClient();
  const formState = useVendorFormState();
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorStatusFilter, setVendorStatusFilter] = useState("ALL");
  const [vendorPage, setVendorPage] = useState(1);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [contractStatusFilter, setContractStatusFilter] = useState("ALL");
  const [contractPage, setContractPage] = useState(1);

  useEffect(() => {
    setVendorPage(1);
  }, [vendorSearch, vendorStatusFilter]);

  useEffect(() => {
    setContractPage(1);
  }, [contractStatusFilter, selectedVendorId]);

  const vendorsPageQuery = useQuery({
    queryKey: dashboardQueryKeys.vendorsPage(sessionAccessToken, {
      page: vendorPage - 1,
      size: DASHBOARD_ITEMS_PER_PAGE,
      query: vendorSearch,
      status: vendorStatusFilter,
    }),
    queryFn: () =>
      fetchVendorsPage(sessionAccessToken as string, {
        page: vendorPage - 1,
        size: DASHBOARD_ITEMS_PER_PAGE,
        query: vendorSearch.trim() || undefined,
        status:
          vendorStatusFilter === "ALL"
            ? undefined
            : (vendorStatusFilter as "ACTIVE" | "OFFBOARDED"),
      }),
    enabled: Boolean(sessionAccessToken),
    placeholderData: (previous) => previous,
  });

  const paginatedVendors = vendorsPageQuery.data?.items ?? vendors;
  const vendorsTotal = vendorsPageQuery.data?.totalElements ?? vendors.length;
  const vendorPageCount =
    vendorsPageQuery.data?.totalPages ?? pageCount(vendors.length, DASHBOARD_ITEMS_PER_PAGE);

  useEffect(() => {
    if (vendorsPageQuery.data && vendorsPageQuery.data.items.length === 0) {
      setSelectedVendorId("");
      return;
    }

    if (!vendors.length && !paginatedVendors.length) {
      setSelectedVendorId("");
      return;
    }

    const candidateList = paginatedVendors.length ? paginatedVendors : vendors;
    setSelectedVendorId((current) =>
      current && candidateList.some((vendor) => vendor.id === current)
        ? current
        : candidateList[0]?.id || "",
    );
  }, [paginatedVendors, vendors, vendorsPageQuery.data]);

  const selectedVendor =
    paginatedVendors.find((vendor) => vendor.id === selectedVendorId) ||
    vendors.find((vendor) => vendor.id === selectedVendorId) ||
    null;

  useEffect(() => {
    if (!secrets.length) {
      formState.setContractSecretId("");
      return;
    }

    formState.setContractSecretId((current) =>
      current && secrets.some((secret) => secret.id === current) ? current : secrets[0].id,
    );
  }, [formState, secrets]);

  const contractsPageQuery = useQuery({
    queryKey: dashboardQueryKeys.vendorContractsPage(sessionAccessToken, selectedVendorId, {
      page: contractPage - 1,
      size: DASHBOARD_ITEMS_PER_PAGE,
      status: contractStatusFilter,
    }),
    queryFn: () =>
      fetchVendorContractsPage(sessionAccessToken as string, selectedVendorId, {
        page: contractPage - 1,
        size: DASHBOARD_ITEMS_PER_PAGE,
        status:
          contractStatusFilter === "ALL"
            ? undefined
            : (contractStatusFilter as "ACTIVE" | "REVOKED" | "EXPIRED"),
      }),
    enabled: Boolean(sessionAccessToken && selectedVendorId),
    placeholderData: (previous) => previous,
  });

  const vendorContracts = contractsPageQuery.data?.items ?? [];
  const contractsTotal = contractsPageQuery.data?.totalElements ?? vendorContracts.length;
  const contractPageCount =
    contractsPageQuery.data?.totalPages ??
    pageCount(vendorContracts.length, DASHBOARD_ITEMS_PER_PAGE);

  const vendorColumns = useMemo<DataTableColumn<VendorResponse>[]>(
    () => buildVendorColumns(),
    [],
  );

  const contractColumns = useMemo<DataTableColumn<VendorContractResponse>[]>(
    () =>
      buildVendorContractColumns({
        onRevoke: (contract) => formState.setContractRevokeTarget(contract),
      }),
    [formState],
  );

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

  async function invalidateVendorQueries(accessToken: string, vendorId?: string) {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.vendors(accessToken),
      }),
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.vendorsPage(accessToken, {
          page: vendorPage - 1,
          size: DASHBOARD_ITEMS_PER_PAGE,
          query: vendorSearch,
          status: vendorStatusFilter,
        }),
      }),
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.shareLinks(accessToken),
      }),
      ...(vendorId
        ? [
            queryClient.invalidateQueries({
              queryKey: dashboardQueryKeys.vendorContractsPage(accessToken, vendorId, {
                page: contractPage - 1,
                size: DASHBOARD_ITEMS_PER_PAGE,
                status: contractStatusFilter,
              }),
            }),
          ]
        : []),
    ]);
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
      await invalidateVendorQueries(sessionAccessToken, created.id);
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
        expiresAt: formState.contractExpiry ? new Date(formState.contractExpiry).toISOString() : null,
      });
      formState.setCreateContractOpen(false);
      await invalidateVendorQueries(sessionAccessToken, selectedVendor.id);
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
      await invalidateVendorQueries(sessionAccessToken, formState.contractRevokeTarget.vendorId);
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
      await invalidateVendorQueries(sessionAccessToken, formState.vendorOffboardTarget.id);
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
    ...formState,
    contractColumns,
    contractsLoading: contractsPageQuery.isLoading && Boolean(selectedVendorId),
    contractPage,
    contractPageCount,
    contractStatusFilter,
    contractsTotal,
    handleCreateVendor,
    handleCreateVendorContract,
    handleOffboardVendor,
    handleRevokeVendorContract,
    openCreateContract,
    openCreateVendor,
    paginatedVendorContracts: vendorContracts,
    paginatedVendors,
    selectedVendor,
    selectedVendorId,
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
    vendorsAvailable: !sessionAccessToken || !vendorsPageQuery.error,
    vendorsTotal,
  };
}
