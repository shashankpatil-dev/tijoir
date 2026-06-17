import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiBaseUrl } from "@/lib/api/client";
import { buildStaticAppUrl } from "@/lib/auth-client";
import {
  DASHBOARD_ITEMS_PER_PAGE,
  pageCount,
  paginate,
} from "@/features/dashboard/lib/dashboard-pagination";
import { buildShareColumns } from "@/features/dashboard/lib/dashboard-columns";
import type { SharePreview, RouterLike, ShowToast } from "@/features/dashboard/hooks/workspace.types";
import {
  createShareLink,
  fetchShareLinksPage,
  revokeShareLink,
} from "@/features/share-links/api/share-links.api";
import { dashboardQueryKeys } from "@/features/dashboard/lib/query-keys";
import { useShareLinkFormState } from "@/features/share-links/hooks/use-share-link-form-state";
import type {
  ContractPermission,
  ShareLinkResponse,
} from "@/features/share-links/types/share-links.types";
import type { SecretSummary } from "@/features/secrets/types/secrets.types";
import type { DataTableColumn } from "@/components/ui/data-table";

export function useShareLinksWorkspace({
  copyText,
  handleSessionError,
  loadWorkspace,
  router,
  secrets,
  sessionAccessToken,
  setActionBusy,
  setMessage,
  setPublicToken,
  shareLinks,
  showToast,
}: {
  copyText: (value: string, label: string) => Promise<void>;
  handleSessionError: (error: unknown, fallback: string) => void;
  loadWorkspace: (accessToken: string) => Promise<void>;
  router: RouterLike;
  secrets: SecretSummary[];
  sessionAccessToken?: string;
  setActionBusy: (value: string | null) => void;
  setMessage: (value: string) => void;
  setPublicToken: (value: string) => void;
  shareLinks: ShareLinkResponse[];
  showToast: ShowToast;
}) {
  const queryClient = useQueryClient();
  const [lastCreatedShare, setLastCreatedShare] = useState<SharePreview | null>(null);
  const [shareRevokeTarget, setShareRevokeTarget] = useState<ShareLinkResponse | null>(null);
  const formState = useShareLinkFormState(secrets);
  const [shareSearch, setShareSearch] = useState("");
  const [shareStatusFilter, setShareStatusFilter] = useState("ALL");
  const [sharePermissionFilter, setSharePermissionFilter] = useState("ALL");
  const [sharePage, setSharePage] = useState(1);

  useEffect(() => {
    setSharePage(1);
  }, [sharePermissionFilter, shareSearch, shareStatusFilter]);

  const shareLinksPageQuery = useQuery({
    queryKey: dashboardQueryKeys.shareLinksPage(sessionAccessToken, {
      page: sharePage - 1,
      size: DASHBOARD_ITEMS_PER_PAGE,
      query: shareSearch,
      permission: sharePermissionFilter,
      status: shareStatusFilter,
    }),
    queryFn: () =>
      fetchShareLinksPage(sessionAccessToken as string, {
        page: sharePage - 1,
        size: DASHBOARD_ITEMS_PER_PAGE,
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
    }) => createShareLink(sessionAccessToken as string, payload),
  });

  const revokeShareLinkMutation = useMutation({
    mutationFn: (shareLinkId: string) => revokeShareLink(shareLinkId, sessionAccessToken as string),
  });

  async function handleCreateShareLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionAccessToken) {
      router.replace("/login");
      return;
    }
    if (!formState.shareSecretId) {
      setMessage("Select a secret before creating a share link.");
      return;
    }

    setActionBusy("create-share-link");
    setMessage("Creating share link");

    try {
      const created = await createShareLinkMutation.mutateAsync({
        secretId: formState.shareSecretId,
        recipientLabel: formState.shareRecipientLabel || null,
        permission: formState.sharePermission,
        expiresAt: formState.shareExpiry ? new Date(formState.shareExpiry).toISOString() : null,
      });

      if (created.shareToken && typeof window !== "undefined") {
        const appUrl = buildStaticAppUrl("/access", { token: created.shareToken });
        setLastCreatedShare({
          token: created.shareToken,
          appUrl,
          metadataUrl: `${apiBaseUrl}${created.publicMetadataPath || ""}`,
          consumeUrl: `${apiBaseUrl}${created.publicConsumePath || ""}`,
        });
        setPublicToken(created.shareToken);
      }

      formState.setCreateShareOpen(false);
      router.push("/dashboard/share-links");
      await queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.shareLinks(sessionAccessToken),
      });
      await queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.shareLinksPage(sessionAccessToken, {
          page: sharePage - 1,
          size: DASHBOARD_ITEMS_PER_PAGE,
          query: shareSearch,
          permission: sharePermissionFilter,
          status: shareStatusFilter,
        }),
      });
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
      await queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.shareLinks(sessionAccessToken),
      });
      await queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.shareLinksPage(sessionAccessToken, {
          page: sharePage - 1,
          size: DASHBOARD_ITEMS_PER_PAGE,
          query: shareSearch,
          permission: sharePermissionFilter,
          status: shareStatusFilter,
        }),
      });
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
    setSharePage,
    setSharePermissionFilter,
    setShareRevokeTarget,
    setShareSearch,
    setShareStatusFilter,
    shareColumns,
    sharePage,
    sharePageCount,
    shareLinksTotal: shareLinksPageQuery.data?.totalElements ?? shareLinks.length,
    sharePermissionFilter,
    shareRevokeTarget,
    shareSearch,
    shareStatusFilter,
  };
}
