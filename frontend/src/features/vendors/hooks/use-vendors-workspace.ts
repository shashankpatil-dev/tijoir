import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiRequestError } from "@/lib/api/errors";
import type { DataTableColumn } from "@/components/ui/data-table";
import {
  buildVendorColumns,
  buildVendorContractColumns,
} from "@/features/dashboard/lib/dashboard-columns";
import {
  DASHBOARD_ITEMS_PER_PAGE,
  pageCount,
} from "@/features/dashboard/lib/dashboard-pagination";
import { dashboardQueryKeys } from "@/features/dashboard/lib/query-keys";
import type { RouterLike, ShowToast } from "@/features/dashboard/hooks/workspace.types";
import { fetchSecrets } from "@/features/secrets/api/secrets.api";
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
import type {
  VendorContractResponse,
  VendorResponse,
} from "@/features/vendors/types/vendors.types";

export function useVendorsWorkspace({
  handleSessionError,
  router,
  sessionAccessToken,
  setActionBusy,
  setMessage,
  showToast,
}: {
  handleSessionError: (error: unknown, fallback: string) => void;
  router: RouterLike;
  sessionAccessToken?: string;
  setActionBusy: (value: string | null) => void;
  setMessage: (value: string) => void;
  showToast: ShowToast;
}) {
  const queryClient = useQueryClient();
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorStatusFilter, setVendorStatusFilter] = useState("ALL");
  const [vendorPage, setVendorPage] = useState(1);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [contractStatusFilter, setContractStatusFilter] = useState("ALL");
  const [contractPage, setContractPage] = useState(1);
  const [createVendorOpen, setCreateVendorOpen] = useState(false);
  const [createContractOpen, setCreateContractOpen] = useState(false);
  const [vendorName, setVendorName] = useState("Primary SFTP Vendor");
  const [vendorContactName, setVendorContactName] = useState("Primary operator");
  const [vendorContactEmail, setVendorContactEmail] = useState("");
  const [vendorNotes, setVendorNotes] = useState(
    "Handles the organization external integration workflow.",
  );
  const [contractSecretId, setContractSecretId] = useState("");
  const [contractPermission, setContractPermission] = useState("VIEW_UNTIL_REVOKED");
  const [contractExpiry, setContractExpiry] = useState("");
  const [contractRevokeTarget, setContractRevokeTarget] =
    useState<VendorContractResponse | null>(null);
  const [vendorOffboardTarget, setVendorOffboardTarget] =
    useState<VendorResponse | null>(null);

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

  useEffect(() => {
    if (
      vendorsPageQuery.error &&
      !(vendorsPageQuery.error instanceof ApiRequestError && vendorsPageQuery.error.status === 403)
    ) {
      handleSessionError(vendorsPageQuery.error, "Could not load vendors");
    }
  }, [handleSessionError, vendorsPageQuery.error]);

  const paginatedVendors = vendorsPageQuery.data?.items ?? [];
  const vendorsTotal = vendorsPageQuery.data?.totalElements ?? paginatedVendors.length;
  const vendorPageCount =
    vendorsPageQuery.data?.totalPages ??
    pageCount(paginatedVendors.length, DASHBOARD_ITEMS_PER_PAGE);

  useEffect(() => {
    if (!paginatedVendors.length) {
      setSelectedVendorId("");
      return;
    }

    setSelectedVendorId((current) =>
      current && paginatedVendors.some((vendor) => vendor.id === current)
        ? current
        : paginatedVendors[0]?.id || "",
    );
  }, [paginatedVendors]);

  const selectedVendor =
    paginatedVendors.find((vendor) => vendor.id === selectedVendorId) || null;

  const secretOptionsQuery = useQuery({
    queryKey: dashboardQueryKeys.secretOptions(sessionAccessToken),
    queryFn: () => fetchSecrets(sessionAccessToken as string),
    enabled: Boolean(sessionAccessToken && createContractOpen),
    staleTime: 60_000,
  });

  const secretOptions: SecretSummary[] = secretOptionsQuery.data ?? [];

  useEffect(() => {
    if (secretOptionsQuery.error) {
      handleSessionError(secretOptionsQuery.error, "Could not load secret options");
    }
  }, [handleSessionError, secretOptionsQuery.error]);

  useEffect(() => {
    if (!secretOptions.length) {
      setContractSecretId("");
      return;
    }

    setContractSecretId((current) =>
      current && secretOptions.some((secret) => secret.id === current)
        ? current
        : secretOptions[0].id,
    );
  }, [secretOptions]);

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

  useEffect(() => {
    if (contractsPageQuery.error) {
      handleSessionError(contractsPageQuery.error, "Could not load vendor contracts");
    }
  }, [contractsPageQuery.error, handleSessionError]);

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
        onRevoke: (contract) => setContractRevokeTarget(contract),
      }),
    [],
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

  async function invalidateVendors(vendorId?: string) {
    if (!sessionAccessToken) {
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.dashboardSummary(sessionAccessToken),
      }),
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.vendors(sessionAccessToken),
      }),
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.vendorsPage(sessionAccessToken, {
          page: vendorPage - 1,
          size: DASHBOARD_ITEMS_PER_PAGE,
          query: vendorSearch,
          status: vendorStatusFilter,
        }),
      }),
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.shareLinks(sessionAccessToken),
      }),
      ...(vendorId
        ? [
            queryClient.invalidateQueries({
              queryKey: dashboardQueryKeys.vendorContractsPage(sessionAccessToken, vendorId, {
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
        name: vendorName.trim(),
        contactName: vendorContactName.trim() || null,
        contactEmail: vendorContactEmail.trim() || null,
        notes: vendorNotes.trim() || null,
      });
      setCreateVendorOpen(false);
      setSelectedVendorId(created.id);
      await invalidateVendors(created.id);
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
        secretId: contractSecretId,
        permission: contractPermission as ContractPermission,
        expiresAt: contractExpiry ? new Date(contractExpiry).toISOString() : null,
      });
      setCreateContractOpen(false);
      await invalidateVendors(selectedVendor.id);
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
    if (!sessionAccessToken || !contractRevokeTarget) {
      router.replace("/dashboard/vendors");
      return;
    }

    setActionBusy(`revoke-contract-${contractRevokeTarget.id}`);
    setMessage("Revoking vendor contract");

    try {
      await revokeVendorContractMutation.mutateAsync({
        vendorId: contractRevokeTarget.vendorId,
        contractId: contractRevokeTarget.id,
      });
      await invalidateVendors(contractRevokeTarget.vendorId);
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
    if (!sessionAccessToken || !vendorOffboardTarget) {
      router.replace("/dashboard/vendors");
      return;
    }

    setActionBusy(`offboard-vendor-${vendorOffboardTarget.id}`);
    setMessage("Offboarding vendor");

    try {
      const result = await offboardVendorMutation.mutateAsync(vendorOffboardTarget.id);
      await invalidateVendors(vendorOffboardTarget.id);
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

  function openCreateContract() {
    if (!selectedVendor) {
      setMessage("Select a vendor before creating a contract.");
      return;
    }
    setCreateContractOpen(true);
  }

  return {
    contractColumns,
    contractExpiry,
    contractPage,
    contractPageCount,
    contractPermission,
    contractRevokeTarget,
    contractsLoading: contractsPageQuery.isLoading && Boolean(selectedVendorId),
    contractsTotal,
    contractSecretId,
    contractStatusFilter,
    createContractOpen,
    createVendorOpen,
    handleCreateVendor,
    handleCreateVendorContract,
    handleOffboardVendor,
    handleRevokeVendorContract,
    loadingVendors: vendorsPageQuery.isLoading,
    openCreateContract,
    paginatedVendorContracts: vendorContracts,
    paginatedVendors,
    secretOptions,
    selectedVendor,
    selectedVendorId,
    setContractExpiry,
    setContractPage,
    setContractPermission,
    setContractRevokeTarget,
    setContractSecretId,
    setContractStatusFilter,
    setCreateContractOpen,
    setCreateVendorOpen,
    setSelectedVendorId,
    setVendorContactEmail,
    setVendorContactName,
    setVendorName,
    setVendorNotes,
    setVendorOffboardTarget,
    setVendorPage,
    setVendorSearch,
    setVendorStatusFilter,
    vendorColumns,
    vendorContactEmail,
    vendorContactName,
    vendorName,
    vendorNotes,
    vendorOffboardTarget,
    vendorPage,
    vendorPageCount,
    vendorSearch,
    vendorStatusFilter,
    vendorsAvailable: !(
      vendorsPageQuery.error instanceof ApiRequestError && vendorsPageQuery.error.status === 403
    ),
    vendorsTotal,
  };
}
