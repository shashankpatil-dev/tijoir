import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  buildVendorColumns,
  buildVendorContractColumns,
} from "@/features/dashboard/lib/dashboard-columns";
import { DASHBOARD_ITEMS_PER_PAGE, pageCount } from "@/features/dashboard/lib/dashboard-pagination";
import { dashboardQueryKeys } from "@/features/dashboard/lib/query-keys";
import type { RouterLike, ShowToast } from "@/features/dashboard/hooks/workspace.types";
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

  return {
    ...formState,
    contractColumns,
    contractsLoading: contractsPageQuery.isLoading && Boolean(selectedVendorId),
    contractPage,
    contractPageCount,
    contractStatusFilter,
    contractsTotal,
    ...vendorActions,
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
