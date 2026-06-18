import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiRequestError } from "@/lib/api/errors";
import {
  buildVendorColumns,
  buildVendorContractColumns,
} from "@/features/dashboard/lib/dashboard-columns";
import { DASHBOARD_ITEMS_PER_PAGE, pageCount } from "@/features/dashboard/lib/dashboard-pagination";
import { dashboardQueryKeys } from "@/features/dashboard/lib/query-keys";
import type { RouterLike, ShowToast } from "@/features/dashboard/hooks/workspace.types";
import { fetchSecrets } from "@/features/secrets/api/secrets.api";
import type { SecretSummary } from "@/features/secrets/types/secrets.types";
import {
  fetchVendorContractsPage,
  fetchVendorsPage,
} from "@/features/vendors/api/vendors.api";
import { useVendorActions } from "@/features/vendors/hooks/use-vendor-actions";
import { useVendorListState } from "@/features/vendors/hooks/use-vendor-list-state";
import { useVendorFormState } from "@/features/vendors/hooks/use-vendor-form-state";
import type {
  VendorContractResponse,
  VendorResponse,
} from "@/features/vendors/types/vendors.types";
import type { DataTableColumn } from "@/components/ui/data-table";

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
  const formState = useVendorFormState();
  const {
    contractPage,
    contractStatusFilter,
    selectedVendorId,
    setContractPage,
    setContractStatusFilter,
    setSelectedVendorId,
    setVendorPage,
    setVendorSearch,
    setVendorStatusFilter,
    vendorPage,
    vendorSearch,
    vendorStatusFilter,
  } = useVendorListState();

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
    vendorsPageQuery.data?.totalPages ?? pageCount(paginatedVendors.length, DASHBOARD_ITEMS_PER_PAGE);

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
  }, [paginatedVendors, setSelectedVendorId]);

  const selectedVendor =
    paginatedVendors.find((vendor) => vendor.id === selectedVendorId) || null;

  const secretOptionsQuery = useQuery({
    queryKey: dashboardQueryKeys.secretOptions(sessionAccessToken),
    queryFn: () => fetchSecrets(sessionAccessToken as string),
    enabled: Boolean(sessionAccessToken && formState.createContractOpen),
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
      formState.setContractSecretId("");
      return;
    }

    formState.setContractSecretId((current) =>
      current && secretOptions.some((secret) => secret.id === current) ? current : secretOptions[0].id,
    );
  }, [formState, secretOptions]);

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
        onRevoke: (contract) => formState.setContractRevokeTarget(contract),
      }),
    [formState],
  );

  const vendorActions = useVendorActions({
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
  });

  async function refreshVendors() {
    if (!sessionAccessToken) {
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "vendors-page", sessionAccessToken],
      }),
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "vendor-contracts-page", sessionAccessToken],
      }),
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.secretOptions(sessionAccessToken),
      }),
    ]);
  }

  return {
    ...formState,
    contractColumns,
    contractsLoading: contractsPageQuery.isLoading && Boolean(selectedVendorId),
    contractPage,
    contractPageCount,
    contractStatusFilter,
    contractsTotal,
    ...vendorActions,
    loadingVendors: vendorsPageQuery.isLoading,
    paginatedVendorContracts: vendorContracts,
    paginatedVendors,
    refreshVendors,
    secretOptions,
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
    vendorsAvailable: !(
      vendorsPageQuery.error instanceof ApiRequestError && vendorsPageQuery.error.status === 403
    ),
    vendorsTotal,
  };
}
