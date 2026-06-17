import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { buildStaticAppUrl } from "@/lib/auth-client";
import { DASHBOARD_ITEMS_PER_PAGE, pageCount } from "@/features/dashboard/lib/dashboard-pagination";
import { dashboardQueryKeys } from "@/features/dashboard/lib/query-keys";
import type {
  RouterLike,
  SharePreview,
  ShowToast,
} from "@/features/dashboard/hooks/workspace.types";
import { fetchShareLinksPage } from "@/features/share-links/api/share-links.api";
import { useShareLinkActions } from "@/features/share-links/hooks/use-share-link-actions";
import { useShareLinkFormState } from "@/features/share-links/hooks/use-share-link-form-state";
import { buildShareLinksPageParams } from "@/features/share-links/hooks/share-link-query-utils";
import { buildShareColumns } from "@/features/share-links/lib/share-link-columns";
import type {
  ContractPermission,
  ShareLinkResponse,
} from "@/features/share-links/types/share-links.types";
import type { SecretSummary } from "@/features/secrets/types/secrets.types";
import { fetchVendorContractsPage } from "@/features/vendors/api/vendors.api";
import type { VendorResponse } from "@/features/vendors/types/vendors.types";
import type { DataTableColumn } from "@/components/ui/data-table";

export function useShareLinksWorkspace({
  copyText,
  handleSessionError,
  router,
  secrets,
  sessionAccessToken,
  setActionBusy,
  setMessage,
  setPublicToken,
  shareLinks,
  showToast,
  vendors,
}: {
  copyText: (value: string, label: string) => Promise<void>;
  handleSessionError: (error: unknown, fallback: string) => void;
  router: RouterLike;
  secrets: SecretSummary[];
  sessionAccessToken?: string;
  setActionBusy: (value: string | null) => void;
  setMessage: (value: string) => void;
  setPublicToken: (value: string) => void;
  shareLinks: ShareLinkResponse[];
  showToast: ShowToast;
  vendors: VendorResponse[];
}) {
  const [lastCreatedShare, setLastCreatedShare] = useState<SharePreview | null>(null);
  const [shareRevokeTarget, setShareRevokeTarget] = useState<ShareLinkResponse | null>(null);
  const [selectedShareLinkId, setSelectedShareLinkId] = useState("");
  const [shareSearch, setShareSearch] = useState("");
  const [shareStatusFilter, setShareStatusFilter] = useState("ALL");
  const [sharePermissionFilter, setSharePermissionFilter] = useState("ALL");
  const [sharePage, setSharePage] = useState(1);
  const formState = useShareLinkFormState(secrets);

  useEffect(() => {
    setSharePage(1);
  }, [sharePermissionFilter, shareSearch, shareStatusFilter]);

  const activeVendorContractsQuery = useQuery({
    queryKey: dashboardQueryKeys.vendorContractsPage(
      sessionAccessToken,
      formState.shareVendorId,
      {
        page: 0,
        size: 100,
        status: "ACTIVE",
      },
    ),
    queryFn: () =>
      fetchVendorContractsPage(sessionAccessToken as string, formState.shareVendorId, {
        page: 0,
        size: 100,
        status: "ACTIVE",
      }),
    enabled: Boolean(sessionAccessToken && formState.shareVendorId),
    placeholderData: (previous) => previous,
  });

  const vendorContractsForShare = activeVendorContractsQuery.data?.items ?? [];

  useEffect(() => {
    if (!formState.shareVendorId) {
      if (formState.shareContractId) {
        formState.setShareContractId("");
      }
      return;
    }

    if (!vendors.some((vendor) => vendor.id === formState.shareVendorId)) {
      formState.setShareVendorId("");
      formState.setShareContractId("");
    }
  }, [formState, vendors]);

  useEffect(() => {
    if (
      formState.shareContractId &&
      !vendorContractsForShare.some((contract) => contract.id === formState.shareContractId)
    ) {
      formState.setShareContractId("");
    }
  }, [formState, vendorContractsForShare]);

  const selectedContract =
    vendorContractsForShare.find((contract) => contract.id === formState.shareContractId) ||
    null;

  useEffect(() => {
    if (!selectedContract) {
      return;
    }

    if (formState.shareSecretId !== selectedContract.secretId) {
      formState.setShareSecretId(selectedContract.secretId);
    }
    if (formState.sharePermission !== selectedContract.permission) {
      formState.setSharePermission(selectedContract.permission);
    }
  }, [formState, selectedContract]);

  const shareLinksPageParams = buildShareLinksPageParams({
    page: sharePage,
    query: shareSearch,
    permission: sharePermissionFilter,
    status: shareStatusFilter,
  });

  const shareLinksPageQuery = useQuery({
    queryKey: dashboardQueryKeys.shareLinksPage(sessionAccessToken, shareLinksPageParams),
    queryFn: () =>
      fetchShareLinksPage(sessionAccessToken as string, {
        page: shareLinksPageParams.page,
        size: shareLinksPageParams.size,
        query: shareSearch.trim() || undefined,
        permission:
          sharePermissionFilter === "ALL"
            ? undefined
            : (sharePermissionFilter as ContractPermission),
        status: shareStatusFilter === "ALL" ? undefined : shareStatusFilter,
      }),
    enabled: Boolean(sessionAccessToken),
    placeholderData: (previous) => previous,
  });

  const filteredShareLinks = shareLinksPageQuery.data?.items ?? shareLinks;
  const paginatedShareLinks = filteredShareLinks;
  const sharePageCount =
    shareLinksPageQuery.data?.totalPages ?? pageCount(shareLinks.length, DASHBOARD_ITEMS_PER_PAGE);

  useEffect(() => {
    if (!paginatedShareLinks.length) {
      setSelectedShareLinkId("");
      return;
    }

    setSelectedShareLinkId((current) =>
      current && paginatedShareLinks.some((shareLink) => shareLink.id === current)
        ? current
        : paginatedShareLinks[0].id,
    );
  }, [paginatedShareLinks]);

  const selectedShareLink =
    paginatedShareLinks.find((shareLink) => shareLink.id === selectedShareLinkId) ||
    shareLinks.find((shareLink) => shareLink.id === selectedShareLinkId) ||
    null;

  const selectedShareLinkAppUrl =
    selectedShareLink?.shareToken && typeof window !== "undefined"
      ? buildStaticAppUrl("/access", { token: selectedShareLink.shareToken })
      : null;

  const shareColumns = useMemo<DataTableColumn<ShareLinkResponse>[]>(
    () =>
      buildShareColumns({
        copyText,
        onRevoke: (shareLink) => setShareRevokeTarget(shareLink),
      }),
    [copyText],
  );

  const { handleCreateShareLink, handleRevokeShareLink } = useShareLinkActions({
    formState,
    handleSessionError,
    onCreateSuccess: (created, preview) => {
      setLastCreatedShare(preview);
      setSelectedShareLinkId(created.id);
    },
    page: sharePage,
    permissionFilter: sharePermissionFilter,
    query: shareSearch,
    router,
    sessionAccessToken,
    setActionBusy,
    setMessage,
    setPublicToken,
    showToast,
    statusFilter: shareStatusFilter,
  });

  function openCreateShareLink() {
    router.push("/dashboard/share-links");
    formState.setCreateShareOpen(true);
  }

  return {
    ...formState,
    filteredShareLinks,
    handleCreateShareLink,
    handleRevokeShareLink,
    lastCreatedShare,
    openCreateShareLink,
    paginatedShareLinks,
    selectedShareLink,
    selectedShareLinkAppUrl,
    selectedShareLinkId,
    setSharePage,
    setSharePermissionFilter,
    setShareRevokeTarget,
    setShareSearch,
    setShareStatusFilter,
    setSelectedShareLinkId,
    shareColumns,
    sharePage,
    sharePageCount,
    shareLinksTotal: shareLinksPageQuery.data?.totalElements ?? shareLinks.length,
    sharePermissionFilter,
    shareRevokeTarget,
    shareSearch,
    shareStatusFilter,
    vendorContractsForShare,
  };
}
