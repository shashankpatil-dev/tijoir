import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { buildStaticAppUrl } from "@/lib/auth-client";
import { ApiRequestError } from "@/lib/api/errors";
import type { DataTableColumn } from "@/components/ui/data-table";
import {
  DASHBOARD_ITEMS_PER_PAGE,
  pageCount,
} from "@/features/dashboard/lib/dashboard-pagination";
import { dashboardQueryKeys } from "@/features/dashboard/lib/query-keys";
import type {
  RouterLike,
  SharePreview,
  ShowToast,
} from "@/features/dashboard/hooks/workspace.types";
import { saveLastPublicToken } from "@/features/recipient-access/api/recipient-access.api";
import { fetchSecrets } from "@/features/secrets/api/secrets.api";
import type { SecretSummary } from "@/features/secrets/types/secrets.types";
import {
  createShareLink,
  fetchShareLinksPage,
  revokeShareLink,
} from "@/features/share-links/api/share-links.api";
import { buildShareColumns } from "@/features/share-links/lib/share-link-columns";
import type {
  ContractPermission,
  ShareLinkResponse,
} from "@/features/share-links/types/share-links.types";
import {
  fetchVendorContractsPage,
  fetchVendors,
} from "@/features/vendors/api/vendors.api";

export function useShareLinksWorkspace({
  handleSessionError,
  router,
  sessionAccessToken,
  setActionBusy,
  setMessage,
  showToast,
  copyText,
}: {
  copyText: (value: string, label: string) => Promise<void>;
  handleSessionError: (error: unknown, fallback: string) => void;
  router: RouterLike;
  sessionAccessToken?: string;
  setActionBusy: (value: string | null) => void;
  setMessage: (value: string) => void;
  showToast: ShowToast;
}) {
  const queryClient = useQueryClient();
  const [lastCreatedShare, setLastCreatedShare] = useState<SharePreview | null>(null);
  const [shareRevokeTarget, setShareRevokeTarget] = useState<ShareLinkResponse | null>(null);
  const [selectedShareLinkId, setSelectedShareLinkId] = useState("");
  const [shareSearch, setShareSearch] = useState("");
  const [shareStatusFilter, setShareStatusFilter] = useState("ALL");
  const [sharePermissionFilter, setSharePermissionFilter] = useState("ALL");
  const [sharePage, setSharePage] = useState(1);
  const [createShareOpen, setCreateShareOpen] = useState(false);
  const [shareSecretId, setShareSecretId] = useState("");
  const [shareVendorId, setShareVendorId] = useState("");
  const [shareContractId, setShareContractId] = useState("");
  const [shareRecipientLabel, setShareRecipientLabel] = useState(
    "Primary vendor operator",
  );
  const [sharePermission, setSharePermission] =
    useState<ContractPermission>("VIEW_ONCE");
  const [shareExpiry, setShareExpiry] = useState("");

  useEffect(() => {
    setSharePage(1);
  }, [sharePermissionFilter, shareSearch, shareStatusFilter]);

  const secretOptionsQuery = useQuery({
    queryKey: dashboardQueryKeys.secretOptions(sessionAccessToken),
    queryFn: () => fetchSecrets(sessionAccessToken as string),
    enabled: Boolean(sessionAccessToken && createShareOpen),
    staleTime: 60_000,
  });

  const vendorOptionsQuery = useQuery({
    queryKey: dashboardQueryKeys.vendors(sessionAccessToken),
    queryFn: () => fetchVendors(sessionAccessToken as string),
    enabled: Boolean(sessionAccessToken && createShareOpen),
    staleTime: 60_000,
  });

  const secretOptions = secretOptionsQuery.data ?? [];
  const vendorOptions = vendorOptionsQuery.data ?? [];

  useEffect(() => {
    if (!secretOptions.length) {
      setShareSecretId("");
      return;
    }

    setShareSecretId((current) =>
      current && secretOptions.some((secret) => secret.id === current) ? current : secretOptions[0].id,
    );
  }, [secretOptions]);

  useEffect(() => {
    if (secretOptionsQuery.error) {
      handleSessionError(secretOptionsQuery.error, "Could not load secret options");
    }
  }, [handleSessionError, secretOptionsQuery.error]);

  useEffect(() => {
    if (vendorOptionsQuery.error) {
      handleSessionError(vendorOptionsQuery.error, "Could not load vendor options");
    }
  }, [handleSessionError, vendorOptionsQuery.error]);

  const activeVendorContractsQuery = useQuery({
    queryKey: dashboardQueryKeys.vendorContractsPage(sessionAccessToken, shareVendorId, {
      page: 0,
      size: 100,
      status: "ACTIVE",
    }),
    queryFn: () =>
      fetchVendorContractsPage(sessionAccessToken as string, shareVendorId, {
        page: 0,
        size: 100,
        status: "ACTIVE",
      }),
    enabled: Boolean(sessionAccessToken && shareVendorId && createShareOpen),
    placeholderData: (previous) => previous,
  });

  const vendorContractsForShare = activeVendorContractsQuery.data?.items ?? [];

  useEffect(() => {
    if (!shareVendorId) {
      if (shareContractId) {
        setShareContractId("");
      }
      return;
    }

    if (!vendorOptions.some((vendor) => vendor.id === shareVendorId)) {
      setShareVendorId("");
      setShareContractId("");
    }
  }, [shareContractId, shareVendorId, vendorOptions]);

  useEffect(() => {
    if (shareContractId && !vendorContractsForShare.some((contract) => contract.id === shareContractId)) {
      setShareContractId("");
    }
  }, [shareContractId, vendorContractsForShare]);

  const selectedContract =
    vendorContractsForShare.find((contract) => contract.id === shareContractId) || null;

  useEffect(() => {
    if (!selectedContract) {
      return;
    }

    if (shareSecretId !== selectedContract.secretId) {
      setShareSecretId(selectedContract.secretId);
    }
    if (sharePermission !== selectedContract.permission) {
      setSharePermission(selectedContract.permission);
    }
  }, [selectedContract, sharePermission, shareSecretId]);

  const shareLinksPageParams = {
    page: sharePage - 1,
    size: DASHBOARD_ITEMS_PER_PAGE,
    query: shareSearch,
    permission: sharePermissionFilter,
    status: shareStatusFilter,
  };

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

  useEffect(() => {
    if (
      shareLinksPageQuery.error &&
      !(shareLinksPageQuery.error instanceof ApiRequestError && shareLinksPageQuery.error.status === 403)
    ) {
      handleSessionError(shareLinksPageQuery.error, "Could not load share links");
    }
  }, [handleSessionError, shareLinksPageQuery.error]);

  const paginatedShareLinks = shareLinksPageQuery.data?.items ?? [];
  const filteredShareLinksLength =
    shareLinksPageQuery.data?.totalElements ?? paginatedShareLinks.length;
  const sharePageCount =
    shareLinksPageQuery.data?.totalPages ??
    pageCount(paginatedShareLinks.length, DASHBOARD_ITEMS_PER_PAGE);

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
    paginatedShareLinks.find((shareLink) => shareLink.id === selectedShareLinkId) || null;

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

  const createShareLinkMutation = useMutation({
    mutationFn: (payload: {
      secretId: string;
      recipientLabel: string | null;
      permission: ContractPermission;
      expiresAt: string | null;
      vendorId?: string | null;
      contractId?: string | null;
    }) => createShareLink(sessionAccessToken as string, payload),
  });

  const revokeShareLinkMutation = useMutation({
    mutationFn: (shareLinkId: string) => revokeShareLink(shareLinkId, sessionAccessToken as string),
  });

  async function invalidateShareLinks() {
    if (!sessionAccessToken) {
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.dashboardSummary(sessionAccessToken),
      }),
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.shareLinks(sessionAccessToken),
      }),
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.shareLinksPage(sessionAccessToken, shareLinksPageParams),
      }),
    ]);
  }

  async function handleCreateShareLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionAccessToken) {
      router.replace("/login");
      return;
    }
    if (!shareSecretId) {
      setMessage("Select a secret before creating a share link.");
      return;
    }

    setActionBusy("create-share-link");
    setMessage("Creating share link");

    try {
      const created = await createShareLinkMutation.mutateAsync({
        secretId: shareSecretId,
        recipientLabel: shareRecipientLabel || null,
        permission: sharePermission,
        expiresAt: shareExpiry ? new Date(shareExpiry).toISOString() : null,
        vendorId: shareVendorId || null,
        contractId: shareContractId || null,
      });

      const preview =
        created.shareToken && typeof window !== "undefined"
          ? {
              token: created.shareToken,
              appUrl: buildStaticAppUrl("/access", { token: created.shareToken }),
            }
          : null;

      if (created.shareToken) {
        saveLastPublicToken(created.shareToken);
      }

      setCreateShareOpen(false);
      await invalidateShareLinks();
      setLastCreatedShare(preview);
      setSelectedShareLinkId(created.id);
      setMessage(`Share link created for ${created.secretKey}.`);
      showToast({
        title: "Share link created",
        description: `${created.secretKey} is ready for recipient testing.`,
        tone: "success",
      });
    } catch (error) {
      handleSessionError(error, "Could not create share link");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleRevokeShareLink(shareLinkId: string) {
    if (!sessionAccessToken) {
      router.replace("/login");
      return;
    }

    setActionBusy(`revoke-share-${shareLinkId}`);
    setMessage("Revoking share link");

    try {
      await revokeShareLinkMutation.mutateAsync(shareLinkId);
      await invalidateShareLinks();
      setMessage("Share link revoked.");
      showToast({
        title: "Share link revoked",
        description: "Recipient access for this link has been closed.",
        tone: "warning",
      });
    } catch (error) {
      handleSessionError(error, "Could not revoke share link");
    } finally {
      setActionBusy(null);
    }
  }

  return {
    createShareOpen,
    filteredShareLinksLength,
    handleCreateShareLink,
    handleRevokeShareLink,
    lastCreatedShare,
    loadingShareLinks: shareLinksPageQuery.isLoading,
    paginatedShareLinks,
    secrets: secretOptions,
    selectedShareLink,
    selectedShareLinkAppUrl,
    selectedShareLinkId,
    setCreateShareOpen,
    setSelectedShareLinkId,
    setShareContractId,
    setShareExpiry,
    setSharePage,
    setSharePermission,
    setSharePermissionFilter,
    setShareRecipientLabel,
    setShareRevokeTarget,
    setShareSearch,
    setShareSecretId,
    setShareStatusFilter,
    setShareVendorId,
    shareColumns,
    shareContractId,
    shareExpiry,
    shareLinksAvailable: !(
      shareLinksPageQuery.error instanceof ApiRequestError && shareLinksPageQuery.error.status === 403
    ),
    sharePage,
    sharePageCount,
    sharePermission,
    sharePermissionFilter,
    shareRecipientLabel,
    shareRevokeTarget,
    shareSearch,
    shareSecretId,
    shareStatusFilter,
    shareTotal: filteredShareLinksLength,
    shareVendorId,
    vendorContractsForShare,
    vendors: vendorOptions,
  };
}
