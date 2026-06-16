import { FormEvent, useEffect, useMemo, useState } from "react";
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
  revokeShareLink,
} from "@/features/share-links/api/share-links.api";
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
  const [lastCreatedShare, setLastCreatedShare] = useState<SharePreview | null>(null);
  const [createShareOpen, setCreateShareOpen] = useState(false);
  const [shareRevokeTarget, setShareRevokeTarget] = useState<ShareLinkResponse | null>(null);
  const [shareSecretId, setShareSecretId] = useState("");
  const [shareRecipientLabel, setShareRecipientLabel] = useState(
    "Primary vendor operator",
  );
  const [sharePermission, setSharePermission] =
    useState<ContractPermission>("VIEW_ONCE");
  const [shareExpiry, setShareExpiry] = useState("");
  const [shareSearch, setShareSearch] = useState("");
  const [shareStatusFilter, setShareStatusFilter] = useState("ALL");
  const [sharePermissionFilter, setSharePermissionFilter] = useState("ALL");
  const [sharePage, setSharePage] = useState(1);

  useEffect(() => {
    setSharePage(1);
  }, [sharePermissionFilter, shareSearch, shareStatusFilter]);

  useEffect(() => {
    if (!secrets.length) {
      setShareSecretId("");
      return;
    }
    setShareSecretId((current) =>
      current && secrets.some((secret) => secret.id === current) ? current : secrets[0].id,
    );
  }, [secrets]);

  const filteredShareLinks = useMemo(() => {
    const query = shareSearch.trim().toLowerCase();
    return shareLinks.filter((shareLink) => {
      const matchesQuery =
        !query ||
        shareLink.secretName.toLowerCase().includes(query) ||
        shareLink.secretKey.toLowerCase().includes(query) ||
        (shareLink.recipientLabel || "").toLowerCase().includes(query);
      const matchesStatus =
        shareStatusFilter === "ALL" || shareLink.status === shareStatusFilter;
      const matchesPermission =
        sharePermissionFilter === "ALL" || shareLink.permission === sharePermissionFilter;
      return matchesQuery && matchesStatus && matchesPermission;
    });
  }, [shareLinks, sharePermissionFilter, shareSearch, shareStatusFilter]);

  const paginatedShareLinks = paginate(filteredShareLinks, sharePage, DASHBOARD_ITEMS_PER_PAGE);
  const sharePageCount = pageCount(filteredShareLinks.length, DASHBOARD_ITEMS_PER_PAGE);

  const shareColumns = useMemo<DataTableColumn<ShareLinkResponse>[]>(
    () =>
      buildShareColumns({
        copyText,
        onRevoke: (shareLink) => setShareRevokeTarget(shareLink),
      }),
    [copyText],
  );

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
      const created = await createShareLink(sessionAccessToken, {
        secretId: shareSecretId,
        recipientLabel: shareRecipientLabel || null,
        permission: sharePermission,
        expiresAt: shareExpiry ? new Date(shareExpiry).toISOString() : null,
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

      setCreateShareOpen(false);
      router.push("/dashboard/share-links");
      await loadWorkspace(sessionAccessToken);
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
      await revokeShareLink(shareLinkId, sessionAccessToken);
      await loadWorkspace(sessionAccessToken);
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
    setCreateShareOpen(true);
  }

  return {
    createShareOpen,
    filteredShareLinks,
    handleCreateShareLink,
    handleRevokeShareLink,
    lastCreatedShare,
    openCreateShareLink,
    paginatedShareLinks,
    setCreateShareOpen,
    setShareExpiry,
    setSharePage,
    setSharePermission,
    setSharePermissionFilter,
    setShareRecipientLabel,
    setShareRevokeTarget,
    setShareSearch,
    setShareSecretId,
    setShareStatusFilter,
    shareColumns,
    shareExpiry,
    sharePage,
    sharePageCount,
    sharePermission,
    sharePermissionFilter,
    shareRecipientLabel,
    shareRevokeTarget,
    shareSearch,
    shareSecretId,
    shareStatusFilter,
  };
}
