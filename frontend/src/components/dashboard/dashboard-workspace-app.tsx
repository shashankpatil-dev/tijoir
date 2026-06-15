"use client";

import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  DashboardSectionHeader,
  DashboardShell,
  DetailList,
  EmptyState,
  PageSection,
  StatCard,
  type DashboardNavItem,
} from "@/components/dashboard/dashboard-shell";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { BusyOverlay, InlineMessage } from "@/components/ui/feedback";
import { SelectField, TextAreaField, TextField } from "@/components/ui/form-fields";
import {
  FilterSelect,
  PaginationControls,
  SearchInput,
  TableToolbar,
} from "@/components/ui/table-controls";
import {
  ApiRequestError,
  apiBaseUrl,
  apiRequest,
  authenticatedApiRequest,
  buildStaticAppUrl,
  readLastPublicToken,
  readWorkspaceCache,
  saveLastPublicToken,
  saveSession,
  saveWorkspaceCache,
  type AuthResponse,
  type ConsumeShareLinkResponse,
  type ContractPermission,
  type GeneratedSecretResponse,
  type PublicShareLinkMetadataResponse,
  type RevealSecretResponse,
  type SecretDetail,
  type SecretSummary,
  type SecretType,
  type ShareLinkResponse,
} from "@/lib/auth-client";
import { useToast } from "@/components/ui/toast-provider";

export type DashboardViewKey = "overview" | "vault" | "share" | "recipient";

type SharePreview = {
  token: string;
  appUrl: string;
  metadataUrl: string;
  consumeUrl: string;
};

const secretTypes: SecretType[] = [
  "PASSWORD",
  "API_KEY",
  "WEBHOOK_SECRET",
  "SSH_PUBLIC_KEY",
  "SSH_PRIVATE_KEY",
  "SFTP_PASSWORD",
  "TOKEN",
  "CERTIFICATE",
  "CUSTOM",
];

const contractPermissions: ContractPermission[] = [
  "VIEW_ONCE",
  "VIEW_UNTIL_REVOKED",
  "ROTATION_NOTIFY_ONLY",
];

const generatorSupportedTypes = new Set<SecretType>([
  "PASSWORD",
  "API_KEY",
  "WEBHOOK_SECRET",
  "SFTP_PASSWORD",
  "TOKEN",
  "CUSTOM",
]);

const ITEMS_PER_PAGE = 6;

export function DashboardWorkspaceApp({
  initialSession,
  removeSession,
}: {
  initialSession: AuthResponse;
  removeSession: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();
  const activeView = viewFromPath(pathname);

  const [session, setSession] = useState<AuthResponse | null>(initialSession);
  const [message, setMessage] = useState("Loading workspace");
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [shareLinksAvailable, setShareLinksAvailable] = useState(true);

  const [secrets, setSecrets] = useState<SecretSummary[]>([]);
  const [selectedSecretId, setSelectedSecretId] = useState("");
  const [selectedSecretDetail, setSelectedSecretDetail] =
    useState<SecretDetail | null>(null);
  const [revealedSecret, setRevealedSecret] =
    useState<RevealSecretResponse | null>(null);
  const [shareLinks, setShareLinks] = useState<ShareLinkResponse[]>([]);
  const [lastCreatedShare, setLastCreatedShare] = useState<SharePreview | null>(
    null,
  );

  const [createSecretOpen, setCreateSecretOpen] = useState(false);
  const [rotateDialogOpen, setRotateDialogOpen] = useState(false);
  const [createShareOpen, setCreateShareOpen] = useState(false);
  const [secretRevokeTarget, setSecretRevokeTarget] = useState<SecretSummary | null>(
    null,
  );
  const [shareRevokeTarget, setShareRevokeTarget] =
    useState<ShareLinkResponse | null>(null);

  const [createName, setCreateName] = useState("Vendor API Key");
  const [createType, setCreateType] = useState<SecretType>("API_KEY");
  const [createDescription, setCreateDescription] = useState(
    "Used by the primary integration vendor",
  );
  const [createValue, setCreateValue] = useState("");
  const [generateLength, setGenerateLength] = useState("32");
  const [rotateValue, setRotateValue] = useState("");

  const [shareSecretId, setShareSecretId] = useState("");
  const [shareRecipientLabel, setShareRecipientLabel] = useState(
    "Primary vendor operator",
  );
  const [sharePermission, setSharePermission] =
    useState<ContractPermission>("VIEW_ONCE");
  const [shareExpiry, setShareExpiry] = useState("");

  const [publicToken, setPublicToken] = useState("");
  const [publicMetadata, setPublicMetadata] =
    useState<PublicShareLinkMetadataResponse | null>(null);
  const [publicConsumedValue, setPublicConsumedValue] =
    useState<ConsumeShareLinkResponse | null>(null);

  const [vaultSearch, setVaultSearch] = useState("");
  const [vaultStatusFilter, setVaultStatusFilter] = useState("ALL");
  const [vaultTypeFilter, setVaultTypeFilter] = useState("ALL");
  const [vaultPage, setVaultPage] = useState(1);

  const [shareSearch, setShareSearch] = useState("");
  const [shareStatusFilter, setShareStatusFilter] = useState("ALL");
  const [sharePermissionFilter, setSharePermissionFilter] = useState("ALL");
  const [sharePage, setSharePage] = useState(1);

  useEffect(() => {
    setSession(initialSession);
    const cached = readWorkspaceCache(initialSession.organization.slug);
    const rememberedToken = readLastPublicToken();

    if (cached) {
      setSecrets(cached.secrets);
      setShareLinks(cached.shareLinks);
      setSelectedSecretId(cached.selectedSecretId || "");
      setMessage("Session restored. Showing cached workspace while live data loads.");
    } else {
      setMessage("Session restored. Loading organization data.");
    }

    if (rememberedToken) {
      setPublicToken(rememberedToken);
    }
  }, [initialSession]);

  useEffect(() => {
    if (!session?.accessToken) {
      return;
    }

    void loadWorkspace(session.accessToken);
  }, [session?.accessToken]);

  useEffect(() => {
    if (!secrets.length) {
      setSelectedSecretId("");
      setSelectedSecretDetail(null);
      setRevealedSecret(null);
      setShareSecretId("");
      return;
    }

    if (!selectedSecretId || !secrets.some((secret) => secret.id === selectedSecretId)) {
      setSelectedSecretId(secrets[0].id);
    }

    setShareSecretId((current) =>
      current && secrets.some((secret) => secret.id === current)
        ? current
        : secrets[0].id,
    );
  }, [secrets, selectedSecretId]);

  useEffect(() => {
    if (!session?.accessToken || !selectedSecretId) {
      return;
    }

    void loadSecretDetail(selectedSecretId, session.accessToken);
  }, [selectedSecretId, session?.accessToken]);

  useEffect(() => {
    if (!session?.organization.slug) {
      return;
    }

    saveWorkspaceCache(session.organization.slug, {
      secrets,
      shareLinks,
      selectedSecretId,
      activeView,
      updatedAt: new Date().toISOString(),
    });
  }, [activeView, secrets, selectedSecretId, session?.organization.slug, shareLinks]);

  useEffect(() => {
    if (!publicToken.trim()) {
      return;
    }

    saveLastPublicToken(publicToken.trim());
  }, [publicToken]);

  useEffect(() => {
    setVaultPage(1);
  }, [vaultSearch, vaultStatusFilter, vaultTypeFilter]);

  useEffect(() => {
    setSharePage(1);
  }, [sharePermissionFilter, shareSearch, shareStatusFilter]);

  const activeSecret = useMemo(
    () => secrets.find((secret) => secret.id === selectedSecretId) || null,
    [secrets, selectedSecretId],
  );

  const activeShareLinks = useMemo(
    () => shareLinks.filter((shareLink) => shareLink.status === "ACTIVE").length,
    [shareLinks],
  );

  const viewOncePending = useMemo(
    () =>
      shareLinks.filter(
        (shareLink) =>
          shareLink.permission === "VIEW_ONCE" && shareLink.status === "ACTIVE",
      ).length,
    [shareLinks],
  );

  const navigationItems = useMemo<DashboardNavItem[]>(
    () => [
      { id: "overview", label: "Overview", note: "Workspace status" },
      {
        id: "vault",
        label: "Vault",
        note: "Secrets and rotation",
        badge: String(secrets.length),
      },
      {
        id: "share",
        label: "Share Links",
        note: "Vendor access contracts",
        badge: String(activeShareLinks),
      },
      { id: "recipient", label: "Recipient View", note: "Public consume test" },
    ],
    [activeShareLinks, secrets.length],
  );

  const filteredSecrets = useMemo(() => {
    const query = vaultSearch.trim().toLowerCase();

    return secrets.filter((secret) => {
      const matchesQuery =
        !query ||
        secret.name.toLowerCase().includes(query) ||
        secret.secretKey.toLowerCase().includes(query) ||
        secret.type.toLowerCase().includes(query);
      const matchesStatus =
        vaultStatusFilter === "ALL" || secret.status === vaultStatusFilter;
      const matchesType = vaultTypeFilter === "ALL" || secret.type === vaultTypeFilter;
      return matchesQuery && matchesStatus && matchesType;
    });
  }, [secrets, vaultSearch, vaultStatusFilter, vaultTypeFilter]);

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
        sharePermissionFilter === "ALL" ||
        shareLink.permission === sharePermissionFilter;
      return matchesQuery && matchesStatus && matchesPermission;
    });
  }, [shareLinks, sharePermissionFilter, shareSearch, shareStatusFilter]);

  const paginatedSecrets = paginate(filteredSecrets, vaultPage, ITEMS_PER_PAGE);
  const paginatedShareLinks = paginate(filteredShareLinks, sharePage, ITEMS_PER_PAGE);
  const vaultPageCount = pageCount(filteredSecrets.length, ITEMS_PER_PAGE);
  const sharePageCount = pageCount(filteredShareLinks.length, ITEMS_PER_PAGE);

  const secretColumns = useMemo<DataTableColumn<SecretSummary>[]>(
    () => [
      {
        key: "name",
        label: "Secret",
        render: (secret) => (
          <div className="space-y-1">
            <p className="font-semibold text-[var(--color-ink-strong)]">
              {secret.name}
            </p>
            <p className="text-xs text-[var(--color-muted)]">{secret.secretKey}</p>
          </div>
        ),
      },
      { key: "type", label: "Type", render: (secret) => secret.type },
      {
        key: "status",
        label: "Status",
        render: (secret) => (
          <Badge tone={statusTone(secret.status)}>{secret.status}</Badge>
        ),
      },
      {
        key: "version",
        label: "Version",
        render: (secret) => `v${secret.currentVersionNumber}`,
      },
      {
        key: "createdAt",
        label: "Created",
        render: (secret) => formatInstant(secret.createdAt),
      },
    ],
    [],
  );

  const shareColumns = useMemo<DataTableColumn<ShareLinkResponse>[]>(
    () => [
      {
        key: "secret",
        label: "Secret",
        render: (shareLink) => (
          <div className="space-y-1">
            <p className="font-semibold text-[var(--color-ink-strong)]">
              {shareLink.secretName}
            </p>
            <p className="text-xs text-[var(--color-muted)]">{shareLink.secretKey}</p>
          </div>
        ),
      },
      {
        key: "recipient",
        label: "Recipient",
        render: (shareLink) => shareLink.recipientLabel || "Not specified",
      },
      {
        key: "permission",
        label: "Permission",
        render: (shareLink) => (
          <Badge tone={statusTone(shareLink.permission)}>{shareLink.permission}</Badge>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (shareLink) => (
          <Badge tone={statusTone(shareLink.status)}>{shareLink.status}</Badge>
        ),
      },
      {
        key: "expiresAt",
        label: "Expiry",
        render: (shareLink) => formatInstant(shareLink.expiresAt),
      },
      {
        key: "actions",
        label: "Actions",
        render: (shareLink) => (
          <div className="flex flex-wrap gap-2">
            {shareLink.shareToken ? (
              <Button
                onClick={(event) => {
                  event.stopPropagation();
                  void copyText(shareLink.shareToken || "", "Share token");
                }}
                size="sm"
                type="button"
                variant="secondary"
              >
                Copy token
              </Button>
            ) : null}
            <Button
              onClick={(event) => {
                event.stopPropagation();
                setShareRevokeTarget(shareLink);
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              Revoke
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  async function loadWorkspace(accessToken: string) {
    setLoadingWorkspace(true);

    try {
      const [meResult, secretsResult, shareLinksResult] = await Promise.allSettled([
        authenticatedApiRequest<AuthResponse>("/api/auth/me", accessToken),
        authenticatedApiRequest<SecretSummary[]>("/api/secrets", accessToken),
        authenticatedApiRequest<ShareLinkResponse[]>("/api/share-links", accessToken),
      ]);

      if (meResult.status === "rejected") {
        throw meResult.reason;
      }
      if (secretsResult.status === "rejected") {
        throw secretsResult.reason;
      }

      saveSession(meResult.value);
      setSession(meResult.value);
      setSecrets(secretsResult.value);
      setShareLinksAvailable(shareLinksResult.status === "fulfilled");
      setShareLinks(
        shareLinksResult.status === "fulfilled" ? shareLinksResult.value : [],
      );

      if (shareLinksResult.status === "rejected") {
        setMessage(
          "Workspace loaded. Share-link inventory is not available for this role.",
        );
        showToast({
          title: "Workspace loaded",
          description:
            "Vault data is live, but share-link inventory is not available for this role.",
          tone: "warning",
        });
      } else {
        setMessage("Workspace loaded from live backend APIs.");
      }
    } catch (error) {
      handleSessionError(error, "Could not load workspace");
    } finally {
      setLoadingWorkspace(false);
    }
  }

  async function loadSecretDetail(secretId: string, accessToken: string) {
    try {
      const detail = await authenticatedApiRequest<SecretDetail>(
        `/api/secrets/${secretId}`,
        accessToken,
      );
      setSelectedSecretDetail(detail);
      setRevealedSecret((current) => (current?.id === secretId ? current : null));
      setRotateValue("");
    } catch (error) {
      handleSessionError(error, "Could not load secret details");
    }
  }

  async function refreshWorkspace() {
    if (!session?.accessToken) {
      router.replace("/login");
      return;
    }

    setMessage("Refreshing workspace");
    await loadWorkspace(session.accessToken);
  }

  async function handleCreateSecret(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken) {
      router.replace("/login");
      return;
    }

    setActionBusy("create-secret");
    setMessage("Creating secret");

    try {
      const created = await authenticatedApiRequest<SecretDetail>(
        "/api/secrets",
        session.accessToken,
        {
          method: "POST",
          body: JSON.stringify({
            name: createName,
            type: createType,
            description: createDescription || null,
            value: createValue,
          }),
        },
      );

      setCreateValue("");
      setCreateSecretOpen(false);
      setSelectedSecretId(created.id);
      router.push("/dashboard/vault");
      await loadWorkspace(session.accessToken);
      setMessage(`Secret ${created.secretKey} created.`);
      showToast({
        title: "Secret created",
        description: `${created.secretKey} is now stored in the vault.`,
        tone: "success",
      });
    } catch (error) {
      handleSessionError(error, "Could not create secret");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleGenerateSecret() {
    if (!session?.accessToken) {
      router.replace("/login");
      return;
    }

    setActionBusy("generate-secret");
    setMessage("Generating candidate value");

    try {
      const result = await authenticatedApiRequest<GeneratedSecretResponse>(
        "/api/secrets/generate",
        session.accessToken,
        {
          method: "POST",
          body: JSON.stringify({
            type: createType,
            length: Number.parseInt(generateLength, 10),
          }),
        },
      );

      setCreateValue(result.value);
      setMessage(`Generated ${result.type} candidate with length ${result.length}.`);
      showToast({
        title: "Value generated",
        description: `${result.type} candidate generated for the create form.`,
        tone: "success",
      });
    } catch (error) {
      handleSessionError(error, "Could not generate candidate value");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleRevealSecret(secretId: string) {
    if (!session?.accessToken) {
      router.replace("/login");
      return;
    }

    setActionBusy(`reveal-${secretId}`);
    setMessage("Revealing current secret version");

    try {
      const result = await authenticatedApiRequest<RevealSecretResponse>(
        `/api/secrets/${secretId}/reveal`,
        session.accessToken,
        { method: "POST" },
      );

      setRevealedSecret(result);
      setMessage(`Revealed ${result.secretKey} version ${result.versionNumber}.`);
      showToast({
        title: "Secret revealed",
        description: `${result.secretKey} version ${result.versionNumber} was loaded.`,
        tone: "success",
      });
    } catch (error) {
      handleSessionError(error, "Could not reveal secret");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleRotateSecret(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken || !selectedSecretId) {
      return;
    }

    setActionBusy(`rotate-${selectedSecretId}`);
    setMessage("Rotating secret");

    try {
      await authenticatedApiRequest<SecretDetail>(
        `/api/secrets/${selectedSecretId}/rotate`,
        session.accessToken,
        { method: "POST", body: JSON.stringify({ value: rotateValue }) },
      );

      setRotateValue("");
      setRotateDialogOpen(false);
      setRevealedSecret(null);
      await loadWorkspace(session.accessToken);
      await loadSecretDetail(selectedSecretId, session.accessToken);
      setMessage("Secret rotated and active version updated.");
      showToast({
        title: "Secret rotated",
        description: "The active secret version was updated successfully.",
        tone: "success",
      });
    } catch (error) {
      handleSessionError(error, "Could not rotate secret");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleRevokeSecret(secretId: string) {
    if (!session?.accessToken) {
      router.replace("/login");
      return;
    }

    setActionBusy(`revoke-${secretId}`);
    setMessage("Revoking secret");

    try {
      await authenticatedApiRequest<SecretDetail>(
        `/api/secrets/${secretId}/revoke`,
        session.accessToken,
        { method: "POST" },
      );

      setRevealedSecret(null);
      await loadWorkspace(session.accessToken);
      if (secretId === selectedSecretId) {
        await loadSecretDetail(secretId, session.accessToken);
      }
      setMessage("Secret revoked.");
      showToast({
        title: "Secret revoked",
        description: "This vault secret can no longer be revealed.",
        tone: "warning",
      });
    } catch (error) {
      handleSessionError(error, "Could not revoke secret");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleCreateShareLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken) {
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
      const created = await authenticatedApiRequest<ShareLinkResponse>(
        "/api/share-links",
        session.accessToken,
        {
          method: "POST",
          body: JSON.stringify({
            secretId: shareSecretId,
            recipientLabel: shareRecipientLabel || null,
            permission: sharePermission,
            expiresAt: shareExpiry ? new Date(shareExpiry).toISOString() : null,
          }),
        },
      );

      if (created.shareToken && typeof window !== "undefined") {
        const appUrl = buildStaticAppUrl("/access", { token: created.shareToken });
        setLastCreatedShare({
          token: created.shareToken,
          appUrl,
          metadataUrl: `${apiBaseUrl}${created.publicMetadataPath || ""}`,
          consumeUrl: `${apiBaseUrl}${created.publicConsumePath || ""}`,
        });
        setPublicToken(created.shareToken);
        saveLastPublicToken(created.shareToken);
      }

      setCreateShareOpen(false);
      router.push("/dashboard/share-links");
      await loadWorkspace(session.accessToken);
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
    if (!session?.accessToken) {
      router.replace("/login");
      return;
    }

    setActionBusy(`revoke-share-${shareLinkId}`);
    setMessage("Revoking share link");

    try {
      await authenticatedApiRequest<ShareLinkResponse>(
        `/api/share-links/${shareLinkId}/revoke`,
        session.accessToken,
        { method: "POST" },
      );

      await loadWorkspace(session.accessToken);
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

  async function handleLoadPublicMetadata(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!publicToken.trim()) {
      setMessage("Enter a share token first.");
      showToast({
        title: "Token required",
        description: "Paste a share token before loading public metadata.",
        tone: "warning",
      });
      return;
    }

    setActionBusy("load-public-share");
    setMessage("Loading public share metadata");

    try {
      const metadata = await apiRequest<PublicShareLinkMetadataResponse>(
        `/api/public/share-links/${publicToken.trim()}`,
      );
      saveLastPublicToken(publicToken.trim());
      setPublicMetadata(metadata);
      setPublicConsumedValue(null);
      setMessage(`Loaded public metadata for ${metadata.secretName}.`);
      showToast({
        title: "Public metadata loaded",
        description: `${metadata.secretName} contract metadata is available.`,
        tone: "success",
      });
    } catch (error) {
      handleSessionError(error, "Could not load metadata");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleConsumePublicShare() {
    if (!publicToken.trim()) {
      setMessage("Enter a share token first.");
      showToast({
        title: "Token required",
        description: "Paste a share token before consuming the link.",
        tone: "warning",
      });
      return;
    }

    setActionBusy("consume-public-share");
    setMessage("Consuming public share link");

    try {
      const result = await apiRequest<ConsumeShareLinkResponse>(
        `/api/public/share-links/${publicToken.trim()}/consume`,
        { method: "POST" },
      );
      saveLastPublicToken(publicToken.trim());
      setPublicConsumedValue(result);
      setMessage(`Secret ${result.secretKey} consumed successfully.`);
      showToast({
        title: "Share consumed",
        description: `${result.secretKey} was revealed through the public contract flow.`,
        tone: "success",
      });
    } catch (error) {
      handleSessionError(error, "Could not consume share link");
    } finally {
      setActionBusy(null);
    }
  }

  function handleSessionError(error: unknown, fallback: string) {
    const text = error instanceof Error ? error.message : fallback;
    if (
      (error instanceof ApiRequestError && error.status === 401) ||
      text.toLowerCase().includes("unauthorized")
    ) {
      removeSession();
      setSession(null);
      router.replace("/login");
      setMessage("Session expired. Login required.");
      showToast({
        title: "Session expired",
        description: "Log in again to continue using the workspace.",
        tone: "warning",
      });
      return;
    }

    setMessage(text || fallback);
    showToast({
      title: "Request failed",
      description: text || fallback,
      tone: "error",
    });
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${label} copied.`);
      showToast({
        title: "Copied",
        description: `${label} copied to the clipboard.`,
        tone: "success",
      });
    } catch {
      setMessage(`Could not copy ${label.toLowerCase()}.`);
      showToast({
        title: "Copy failed",
        description: `Could not copy ${label.toLowerCase()}.`,
        tone: "error",
      });
    }
  }

  function logout() {
    removeSession();
    setSession(null);
    setSecrets([]);
    setShareLinks([]);
    showToast({
      title: "Logged out",
      description: "The workspace session has been cleared.",
      tone: "info",
    });
    router.push("/login");
  }

  return (
    <DashboardShell
      activeItemId={activeView}
      items={navigationItems}
      onSelect={(value) => router.push(viewPath(value as DashboardViewKey))}
      sidebarFooter={
        <div className="space-y-2">
          <p className="font-semibold text-white">Backend endpoint</p>
          <p className="break-all">{apiBaseUrl}</p>
        </div>
      }
      topbarActions={
        <>
          <Button
            onClick={() => {
              router.push("/dashboard/vault");
              setCreateSecretOpen(true);
            }}
            type="button"
            variant="primary"
          >
            New Secret
          </Button>
          <Button
            onClick={() => {
              router.push("/dashboard/share-links");
              setCreateShareOpen(true);
            }}
            type="button"
            variant="secondary"
          >
            Share Access
          </Button>
          <Button onClick={refreshWorkspace} type="button" variant="secondary">
            {loadingWorkspace ? "Refreshing..." : "Refresh"}
          </Button>
          <Button onClick={logout} type="button" variant="ghost">
            Logout
          </Button>
        </>
      }
      userMeta={
        session ? (
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold text-[var(--color-ink-strong)]">
                {session.organization.name}
              </h1>
              <Badge tone="info">{session.user.role}</Badge>
              <Badge tone={session.user.emailVerified ? "success" : "warning"}>
                {session.user.emailVerified ? "Verified" : "Unverified"}
              </Badge>
            </div>
            <p className="text-sm text-[var(--color-muted)]">
              {session.user.email} · {session.organization.slug}
            </p>
          </div>
        ) : null
      }
    >
      <BusyOverlay
        body="Completing the current workspace action."
        title={loadingWorkspace ? "Refreshing workspace" : "Applying request"}
        visible={loadingWorkspace || actionBusy !== null}
      />

      <section className="space-y-5">
        <DashboardSectionHeader
          description="Manage organization secrets, create contract-scoped share links, and test the public recipient flow from one operational workspace."
          title={titleForView(activeView)}
        />

        <InlineMessage
          body={message}
          title="Workspace activity"
          tone={message.toLowerCase().includes("could not") ? "error" : "neutral"}
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Vault objects"
            note="Secrets available to this organization"
            value={String(secrets.length)}
          />
          <StatCard
            label="Active share links"
            note="Live vendor access contracts"
            value={String(activeShareLinks)}
          />
          <StatCard
            label="View-once pending"
            note="Links waiting for one-time consumption"
            value={String(viewOncePending)}
          />
          <StatCard
            label="Access expires"
            note="JWT access session deadline"
            value={session ? shortTime(session.expiresAt) : "--"}
          />
        </div>

        {activeView === "overview" ? (
          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <PageSection
              description="This is the current organization session context and operational summary."
              title="Current identity"
            >
              {session ? (
                <DetailList
                  items={[
                    { label: "User", value: session.user.name },
                    { label: "Email", value: session.user.email },
                    { label: "Role", value: session.user.role },
                    {
                      label: "Email verified",
                      value: session.user.emailVerified ? "Yes" : "No",
                    },
                    { label: "Organization", value: session.organization.name },
                    { label: "Token expires", value: formatInstant(session.expiresAt) },
                  ]}
                />
              ) : (
                <EmptyState
                  description="No session is available. Return to login to restore the organization workspace."
                  title="No session"
                />
              )}
            </PageSection>

            <div className="space-y-5">
              <PageSection
                description="Focus surfaces the most recent operational context."
                title="Workspace focus"
              >
                <div className="space-y-3">
                  <SurfaceNote
                    label="Selected secret"
                    value={activeSecret ? activeSecret.secretKey : "No secret selected"}
                  />
                  <SurfaceNote
                    label="Last share link"
                    value={
                      lastCreatedShare
                        ? "A new recipient link is ready for testing."
                        : "No share link created in this session."
                    }
                  />
                  <SurfaceNote
                    label="Suggested path"
                    value="Create or rotate a secret, then issue a contract-scoped share link."
                  />
                </div>
              </PageSection>

              <PageSection
                description="Fast entry points for the two current product workflows."
                title="Quick actions"
              >
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => {
                      router.push("/dashboard/vault");
                      setCreateSecretOpen(true);
                    }}
                    type="button"
                  >
                    Create secret
                  </Button>
                  <Button
                    onClick={() => {
                      router.push("/dashboard/share-links");
                      setCreateShareOpen(true);
                    }}
                    type="button"
                    variant="secondary"
                  >
                    Create share link
                  </Button>
                  <Button
                    onClick={() => router.push("/dashboard/recipient")}
                    type="button"
                    variant="outline"
                  >
                    Open recipient test
                  </Button>
                </div>
              </PageSection>
            </div>
          </div>
        ) : null}

        {activeView === "vault" ? (
          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <PageSection
              description="All vault entries for the current organization. Select a row to inspect its current detail and actions."
              title="Vault inventory"
            >
              <div className="space-y-4">
                <TableToolbar
                  actions={
                    <Button onClick={() => setCreateSecretOpen(true)} type="button">
                      Create secret
                    </Button>
                  }
                >
                  <SearchInput
                    onChange={setVaultSearch}
                    placeholder="Search by secret name, key, or type"
                    value={vaultSearch}
                  />
                  <FilterSelect
                    onChange={setVaultStatusFilter}
                    options={[
                      { label: "All statuses", value: "ALL" },
                      { label: "Active", value: "ACTIVE" },
                      { label: "Revoked", value: "REVOKED" },
                    ]}
                    value={vaultStatusFilter}
                  />
                  <FilterSelect
                    onChange={setVaultTypeFilter}
                    options={[
                      { label: "All types", value: "ALL" },
                      ...secretTypes.map((type) => ({ label: type, value: type })),
                    ]}
                    value={vaultTypeFilter}
                  />
                </TableToolbar>

                <DataTable
                  columns={secretColumns}
                  data={paginatedSecrets}
                  emptyDescription="Create the first vault entry to begin the secret lifecycle."
                  emptyTitle="No secrets match the current filters"
                  loading={loadingWorkspace && !secrets.length}
                  onRowClick={(secret) => setSelectedSecretId(secret.id)}
                  rowKey={(secret) => secret.id}
                  selectedRowKey={selectedSecretId}
                />

                <PaginationControls
                  currentPage={vaultPage}
                  itemLabel="secrets"
                  onPageChange={setVaultPage}
                  pageCount={vaultPageCount}
                  totalItems={filteredSecrets.length}
                />
              </div>
            </PageSection>

            <div className="space-y-5">
              <PageSection
                description="Inspect metadata, reveal the active value, rotate the version, or revoke the secret entirely."
                title="Selected secret"
              >
                {selectedSecretDetail ? (
                  <div className="space-y-5">
                    <DetailList
                      items={[
                        { label: "Name", value: selectedSecretDetail.name },
                        { label: "Key", value: selectedSecretDetail.secretKey },
                        { label: "Type", value: selectedSecretDetail.type },
                        {
                          label: "Status",
                          value: (
                            <Badge tone={statusTone(selectedSecretDetail.status)}>
                              {selectedSecretDetail.status}
                            </Badge>
                          ),
                        },
                        {
                          label: "Active version",
                          value: `v${selectedSecretDetail.currentVersionNumber}`,
                        },
                        {
                          label: "Created by",
                          value: `${selectedSecretDetail.createdByName} · ${selectedSecretDetail.createdByEmail}`,
                        },
                      ]}
                    />

                    {selectedSecretDetail.description ? (
                      <SurfaceNote
                        label="Description"
                        value={selectedSecretDetail.description}
                      />
                    ) : null}

                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() => void handleRevealSecret(selectedSecretDetail.id)}
                        type="button"
                        variant="primary"
                      >
                        Reveal value
                      </Button>
                      <Button
                        onClick={() => setRotateDialogOpen(true)}
                        type="button"
                        variant="secondary"
                      >
                        Rotate
                      </Button>
                      <Button
                        onClick={() => setSecretRevokeTarget(activeSecret)}
                        type="button"
                        variant="outline"
                      >
                        Revoke
                      </Button>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    description="Pick a vault row to load the current detail and actions."
                    title="No secret selected"
                  />
                )}
              </PageSection>

              <PageSection
                description="The current active value is only shown after an explicit reveal action."
                title="Reveal output"
              >
                {revealedSecret ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-ink-strong)] p-4 text-white">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-blue-100/80">
                        Secret value
                      </p>
                      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all text-sm leading-6">
                        {revealedSecret.value}
                      </pre>
                    </div>
                    <Button
                      onClick={() => void copyText(revealedSecret.value, "Secret value")}
                      type="button"
                      variant="secondary"
                    >
                      Copy secret value
                    </Button>
                  </div>
                ) : (
                  <EmptyState
                    description="Reveal the selected secret only when the current workflow actually requires the raw value."
                    title="No revealed value"
                  />
                )}
              </PageSection>
            </div>
          </div>
        ) : null}

        {activeView === "share" ? (
          <div className="space-y-5">
            {!shareLinksAvailable ? (
              <InlineMessage
                body="This role can still use vault APIs, but the share-link inventory is not available in the current session."
                title="Share-link inventory unavailable"
                tone="warning"
              />
            ) : null}

            <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
              <PageSection
                description="Issued contract-scoped access links for external recipients."
                title="Share-link inventory"
              >
                <div className="space-y-4">
                  <TableToolbar
                    actions={
                      <Button onClick={() => setCreateShareOpen(true)} type="button">
                        Create share link
                      </Button>
                    }
                  >
                    <SearchInput
                      onChange={setShareSearch}
                      placeholder="Search by secret name, key, or recipient"
                      value={shareSearch}
                    />
                    <FilterSelect
                      onChange={setShareStatusFilter}
                      options={[
                        { label: "All statuses", value: "ALL" },
                        { label: "Active", value: "ACTIVE" },
                        { label: "Revoked", value: "REVOKED" },
                        { label: "Consumed", value: "CONSUMED" },
                        { label: "Expired", value: "EXPIRED" },
                      ]}
                      value={shareStatusFilter}
                    />
                    <FilterSelect
                      onChange={setSharePermissionFilter}
                      options={[
                        { label: "All permissions", value: "ALL" },
                        ...contractPermissions.map((permission) => ({
                          label: permission,
                          value: permission,
                        })),
                      ]}
                      value={sharePermissionFilter}
                    />
                  </TableToolbar>

                  <DataTable
                    columns={shareColumns}
                    data={paginatedShareLinks}
                    emptyDescription="Create a share link for a vault secret to start the recipient flow."
                    emptyTitle="No share links match the current filters"
                    loading={loadingWorkspace && shareLinksAvailable && !shareLinks.length}
                    rowKey={(shareLink) => shareLink.id}
                  />

                  <PaginationControls
                    currentPage={sharePage}
                    itemLabel="share links"
                    onPageChange={setSharePage}
                    pageCount={sharePageCount}
                    totalItems={filteredShareLinks.length}
                  />
                </div>
              </PageSection>

              <div className="space-y-5">
                <PageSection
                  description="The newest share link is staged here for operator testing and vendor handoff."
                  title="Latest recipient package"
                >
                  {lastCreatedShare ? (
                    <div className="space-y-4">
                      <SharePreviewItem
                        label="Recipient app URL"
                        value={lastCreatedShare.appUrl}
                        onCopy={() => void copyText(lastCreatedShare.appUrl, "Recipient URL")}
                      />
                      <SharePreviewItem
                        label="Share token"
                        value={lastCreatedShare.token}
                        onCopy={() => void copyText(lastCreatedShare.token, "Share token")}
                      />
                      <SharePreviewItem
                        label="Metadata URL"
                        value={lastCreatedShare.metadataUrl}
                        onCopy={() => void copyText(lastCreatedShare.metadataUrl, "Metadata URL")}
                      />
                      <SharePreviewItem
                        label="Consume URL"
                        value={lastCreatedShare.consumeUrl}
                        onCopy={() => void copyText(lastCreatedShare.consumeUrl, "Consume URL")}
                      />
                    </div>
                  ) : (
                    <EmptyState
                      description="Create a share link to populate the recipient package with public URLs and the share token."
                      title="No recipient package yet"
                    />
                  )}
                </PageSection>

                <PageSection
                  description="Share links are public recipient contracts. They should be created only after the vault value is ready."
                  title="Contract guidance"
                >
                  <div className="space-y-3">
                    <SurfaceNote
                      label="VIEW_ONCE"
                      value="Reveal succeeds once, then the link moves to consumed."
                    />
                    <SurfaceNote
                      label="VIEW_UNTIL_REVOKED"
                      value="Reveal remains available until the issuer revokes or expiry closes the contract."
                    />
                    <SurfaceNote
                      label="ROTATION_NOTIFY_ONLY"
                      value="Metadata can be inspected, but the raw secret should not be revealed."
                    />
                  </div>
                </PageSection>
              </div>
            </div>
          </div>
        ) : null}

        {activeView === "recipient" ? (
          <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
            <PageSection
              description="Load public metadata and consume a share token without an organization session."
              title="Recipient test"
            >
              <form className="space-y-4" onSubmit={handleLoadPublicMetadata}>
                <TextAreaField
                  hint="Paste the public share token or copy it from the latest recipient package."
                  label="Share token"
                  onChange={setPublicToken}
                  rows={5}
                  value={publicToken}
                />
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" variant="primary">
                    Load metadata
                  </Button>
                  <Button
                    onClick={() => void handleConsumePublicShare()}
                    type="button"
                    variant="secondary"
                  >
                    Consume link
                  </Button>
                </div>
              </form>
            </PageSection>

            <div className="space-y-5">
              <PageSection
                description="Contract metadata is safe to inspect before revealing the payload."
                title="Metadata"
              >
                {publicMetadata ? (
                  <DetailList
                    items={[
                      { label: "Organization", value: publicMetadata.organizationName },
                      { label: "Secret", value: publicMetadata.secretName },
                      { label: "Type", value: publicMetadata.secretType },
                      {
                        label: "Permission",
                        value: (
                          <Badge tone={statusTone(publicMetadata.permission)}>
                            {publicMetadata.permission}
                          </Badge>
                        ),
                      },
                      {
                        label: "Status",
                        value: (
                          <Badge tone={statusTone(publicMetadata.status)}>
                            {publicMetadata.status}
                          </Badge>
                        ),
                      },
                      {
                        label: "Recipient",
                        value: publicMetadata.recipientLabel || "Not specified",
                      },
                    ]}
                  />
                ) : (
                  <EmptyState
                    description="Load metadata for a share token before attempting to consume it."
                    title="No metadata loaded"
                  />
                )}
              </PageSection>

              <PageSection
                description="Consumed output represents the public secret reveal result."
                title="Consumed output"
              >
                {publicConsumedValue ? (
                  <div className="space-y-4">
                    <DetailList
                      items={[
                        { label: "Secret key", value: publicConsumedValue.secretKey },
                        { label: "Name", value: publicConsumedValue.secretName },
                        { label: "Type", value: publicConsumedValue.secretType },
                        {
                          label: "Permission",
                          value: (
                            <Badge tone={statusTone(publicConsumedValue.permission)}>
                              {publicConsumedValue.permission}
                            </Badge>
                          ),
                        },
                      ]}
                    />
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-ink-strong)] p-4 text-white">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-blue-100/80">
                        Revealed value
                      </p>
                      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all text-sm leading-6">
                        {publicConsumedValue.value}
                      </pre>
                    </div>
                    <Button
                      onClick={() =>
                        void copyText(publicConsumedValue.value, "Consumed secret value")
                      }
                      type="button"
                      variant="secondary"
                    >
                      Copy consumed value
                    </Button>
                  </div>
                ) : (
                  <EmptyState
                    description="Consume a valid token to verify the full public reveal path."
                    title="Nothing consumed yet"
                  />
                )}
              </PageSection>
            </div>
          </div>
        ) : null}
      </section>

      <Dialog
        description="Create a new vault secret and optionally generate a candidate value in the same flow."
        onClose={() => setCreateSecretOpen(false)}
        open={createSecretOpen}
        title="Create secret"
      >
        <form className="space-y-4" onSubmit={handleCreateSecret}>
          <TextField label="Secret name" onChange={setCreateName} value={createName} />
          <SelectField
            label="Secret type"
            onChange={(value) => setCreateType(value as SecretType)}
            options={secretTypes}
            value={createType}
          />
          <TextAreaField
            label="Description"
            onChange={setCreateDescription}
            required={false}
            rows={3}
            value={createDescription}
          />
          <div className="grid gap-3 sm:grid-cols-[1fr_140px_auto] sm:items-end">
            <TextAreaField
              label="Secret value"
              onChange={setCreateValue}
              rows={6}
              value={createValue}
            />
            <TextField
              label="Length"
              onChange={setGenerateLength}
              type="number"
              value={generateLength}
            />
            <Button
              disabled={actionBusy !== null || !generatorSupportedTypes.has(createType)}
              onClick={() => void handleGenerateSecret()}
              type="button"
              variant="secondary"
            >
              Generate
            </Button>
          </div>
          <div className="flex justify-end gap-3">
            <Button onClick={() => setCreateSecretOpen(false)} type="button" variant="ghost">
              Cancel
            </Button>
            <Button disabled={actionBusy !== null} type="submit" variant="primary">
              {actionBusy === "create-secret" ? "Creating..." : "Create secret"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        description="Create a new active version for the selected secret."
        onClose={() => setRotateDialogOpen(false)}
        open={rotateDialogOpen}
        title="Rotate secret"
      >
        <form className="space-y-4" onSubmit={handleRotateSecret}>
          <TextAreaField
            label="New secret value"
            onChange={setRotateValue}
            rows={8}
            value={rotateValue}
          />
          <div className="flex justify-end gap-3">
            <Button onClick={() => setRotateDialogOpen(false)} type="button" variant="ghost">
              Cancel
            </Button>
            <Button disabled={actionBusy !== null} type="submit" variant="primary">
              {actionBusy?.startsWith("rotate-") ? "Rotating..." : "Rotate secret"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        description="Issue a public contract-scoped share link for one selected secret."
        onClose={() => setCreateShareOpen(false)}
        open={createShareOpen}
        title="Create share link"
      >
        <form className="space-y-4" onSubmit={handleCreateShareLink}>
          <SelectField
            label="Secret"
            onChange={setShareSecretId}
            options={secrets.map((secret) => ({
              label: `${secret.name} (${secret.secretKey})`,
              value: secret.id,
            }))}
            value={shareSecretId}
          />
          <TextField
            label="Recipient label"
            onChange={setShareRecipientLabel}
            required={false}
            value={shareRecipientLabel}
          />
          <SelectField
            label="Permission"
            onChange={(value) => setSharePermission(value as ContractPermission)}
            options={contractPermissions}
            value={sharePermission}
          />
          <TextField
            hint="Optional. If omitted, the contract remains open until revoke or policy closure."
            label="Expiry"
            onChange={setShareExpiry}
            required={false}
            type="datetime-local"
            value={shareExpiry}
          />
          <div className="flex justify-end gap-3">
            <Button onClick={() => setCreateShareOpen(false)} type="button" variant="ghost">
              Cancel
            </Button>
            <Button disabled={actionBusy !== null || !shareSecretId} type="submit">
              {actionBusy === "create-share-link" ? "Creating..." : "Create share link"}
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        confirmLabel="Revoke secret"
        description={
          secretRevokeTarget
            ? `Revoke ${secretRevokeTarget.secretKey}. This should stop future reveal access for the active vault entry.`
            : ""
        }
        onClose={() => setSecretRevokeTarget(null)}
        onConfirm={() => {
          if (secretRevokeTarget) {
            void handleRevokeSecret(secretRevokeTarget.id);
          }
          setSecretRevokeTarget(null);
        }}
        open={Boolean(secretRevokeTarget)}
        title="Revoke vault secret"
      />

      <ConfirmDialog
        confirmLabel="Revoke link"
        description={
          shareRevokeTarget
            ? `Revoke the contract for ${shareRevokeTarget.secretKey}. Recipient access through this link should be closed immediately.`
            : ""
        }
        onClose={() => setShareRevokeTarget(null)}
        onConfirm={() => {
          if (shareRevokeTarget) {
            void handleRevokeShareLink(shareRevokeTarget.id);
          }
          setShareRevokeTarget(null);
        }}
        open={Boolean(shareRevokeTarget)}
        title="Revoke share link"
      />
    </DashboardShell>
  );
}

function SurfaceNote({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--color-ink)]">{value}</p>
    </div>
  );
}

function SharePreviewItem({
  label,
  onCopy,
  value,
}: {
  label: string;
  onCopy: () => void;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
            {label}
          </p>
          <p className="mt-2 break-all text-sm leading-6 text-[var(--color-ink)]">
            {value}
          </p>
        </div>
        <Button onClick={onCopy} size="sm" type="button" variant="secondary">
          Copy
        </Button>
      </div>
    </div>
  );
}

function formatInstant(value?: string | null) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function shortTime(value?: string | null) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function viewFromPath(pathname: string): DashboardViewKey {
  if (pathname.includes("/dashboard/vault")) {
    return "vault";
  }
  if (pathname.includes("/dashboard/share-links")) {
    return "share";
  }
  if (pathname.includes("/dashboard/recipient")) {
    return "recipient";
  }
  return "overview";
}

function viewPath(view: DashboardViewKey) {
  switch (view) {
    case "vault":
      return "/dashboard/vault";
    case "share":
      return "/dashboard/share-links";
    case "recipient":
      return "/dashboard/recipient";
    default:
      return "/dashboard/overview";
  }
}

function titleForView(view: DashboardViewKey) {
  switch (view) {
    case "vault":
      return "Vault";
    case "share":
      return "Share Links";
    case "recipient":
      return "Recipient View";
    default:
      return "Overview";
  }
}

function pageCount(totalItems: number, perPage: number) {
  return Math.max(1, Math.ceil(totalItems / perPage));
}

function paginate<T>(items: T[], page: number, perPage: number) {
  const start = (page - 1) * perPage;
  return items.slice(start, start + perPage);
}
