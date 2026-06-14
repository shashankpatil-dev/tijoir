"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/auth/auth-guards";
import {
  apiRequest,
  apiBaseUrl,
  authenticatedApiRequest,
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
import { SiteHeader, StatusPanel } from "@/components/site-chrome";
import { SelectField, TextAreaField, TextField } from "@/components/ui/form-fields";
import { BusyOverlay, InlineMessage } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast-provider";

type ViewKey = "overview" | "vault" | "share" | "recipient";

const navigation: Array<{ id: ViewKey; label: string; note: string }> = [
  { id: "overview", label: "Overview", note: "Workspace status" },
  { id: "vault", label: "Vault", note: "Create, reveal, rotate" },
  { id: "share", label: "Share links", note: "Contract-scoped vendor access" },
  { id: "recipient", label: "Recipient view", note: "Public consume flow" },
];

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

type SharePreview = {
  token: string;
  appUrl: string;
  metadataUrl: string;
  consumeUrl: string;
};

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      {(sessionState) => (
        <DashboardWorkspace
          initialSession={sessionState.session!}
          removeSession={sessionState.removeSession}
        />
      )}
    </ProtectedRoute>
  );
}

function DashboardWorkspace({
  initialSession,
  removeSession,
}: {
  initialSession: AuthResponse;
  removeSession: () => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [session, setSession] = useState<AuthResponse | null>(initialSession);
  const [activeView, setActiveView] = useState<ViewKey>("overview");
  const [message, setMessage] = useState("Loading workspace");
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

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

  useEffect(() => {
    setSession(initialSession);
    const cached = readWorkspaceCache(initialSession.organization.slug);
    const rememberedToken = readLastPublicToken();

    if (cached) {
      setSecrets(cached.secrets);
      setShareLinks(cached.shareLinks);
      setSelectedSecretId(cached.selectedSecretId || "");
      setActiveView((cached.activeView as ViewKey) || "overview");
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
      setShareLinks(
        shareLinksResult.status === "fulfilled" ? shareLinksResult.value : [],
      );

      if (shareLinksResult.status === "rejected") {
        setMessage(
          "Workspace loaded. Share-link inventory is not available for this role.",
        );
        showToast({
          title: "Workspace loaded",
          description: "Vault data is live, but share-link inventory is not available for this role.",
          tone: "warning",
        });
      } else {
        setMessage("Workspace loaded from live backend APIs.");
        showToast({
          title: "Workspace loaded",
          description: "Organization data was refreshed from the backend.",
          tone: "success",
        });
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
      setRevealedSecret((current) =>
        current?.id === secretId ? current : null,
      );
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
      setSelectedSecretId(created.id);
      setActiveView("vault");
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
        {
          method: "POST",
          body: JSON.stringify({ value: rotateValue }),
        },
      );

      setRotateValue("");
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
        const appUrl = `${window.location.origin}/access?token=${encodeURIComponent(created.shareToken)}`;
        setLastCreatedShare({
          token: created.shareToken,
          appUrl,
          metadataUrl: `${apiBaseUrl}${created.publicMetadataPath || ""}`,
          consumeUrl: `${apiBaseUrl}${created.publicConsumePath || ""}`,
        });
        setPublicToken(created.shareToken);
        saveLastPublicToken(created.shareToken);
      }

      await loadWorkspace(session.accessToken);
      setActiveView("share");
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
      const metadata = await authenticatedOrPublicMetadata(publicToken.trim());
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

  async function authenticatedOrPublicMetadata(
    token: string,
  ): Promise<PublicShareLinkMetadataResponse> {
    return apiRequest<PublicShareLinkMetadataResponse>(
      `/api/public/share-links/${token}`,
    );
  }

  function handleSessionError(error: unknown, fallback: string) {
    const text = error instanceof Error ? error.message : fallback;
    if (text.toLowerCase().includes("unauthorized")) {
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
    <main className="min-h-screen bg-[var(--color-dashboard-bg)] text-[var(--color-ink)]">
      <SiteHeader
        rightContent={
          <div className="flex items-center gap-3">
            {session ? (
              <div className="hidden rounded-2xl border border-[var(--color-border)] bg-white px-4 py-2 text-right text-xs text-[var(--color-muted)] md:block">
                <p className="font-semibold text-[var(--color-ink-strong)]">
                  {session.organization.name}
                </p>
                <p>{session.user.email}</p>
              </div>
            ) : null}
            <button
              className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-brand)]"
              onClick={refreshWorkspace}
              type="button"
            >
              {loadingWorkspace ? "Refreshing..." : "Refresh"}
            </button>
            <button
              className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-brand)]"
              onClick={logout}
              type="button"
            >
              Logout
            </button>
          </div>
        }
      />

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[250px_1fr] lg:px-8">
        <BusyOverlay
          body="Completing the current workspace action."
          title={loadingWorkspace ? "Refreshing workspace" : "Applying request"}
          visible={loadingWorkspace || actionBusy !== null}
        />
        <aside className="rounded-3xl border border-[var(--color-dashboard-border)] bg-[var(--color-sidebar)] p-5 text-white shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3 border-b border-white/10 pb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 text-sm font-semibold">
              Tj
            </div>
            <div>
              <p className="text-sm font-medium">Tijoir Console</p>
              <p className="text-xs text-blue-100/80">
                Auth, vault, and share links
              </p>
            </div>
          </div>

          <nav className="mt-5 space-y-2 text-sm">
            {navigation.map((item) => (
              <button
                className={`w-full rounded-2xl px-4 py-3 text-left transition ${
                  activeView === item.id
                    ? "bg-white/12 font-medium text-white"
                    : "text-blue-100/78 hover:bg-white/8"
                }`}
                key={item.id}
                onClick={() => setActiveView(item.id)}
                type="button"
              >
                <p>{item.label}</p>
                <p className="mt-1 text-xs text-blue-100/70">{item.note}</p>
              </button>
            ))}
          </nav>

          <div className="mt-6 rounded-2xl bg-white/8 p-4 text-sm text-blue-100/85">
            <p className="font-medium text-white">API endpoint</p>
            <p className="mt-2 break-all">{apiBaseUrl}</p>
          </div>
        </aside>

        <section className="space-y-6">
          <div className="rounded-3xl border border-[var(--color-dashboard-border)] bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-strong)]">
                  Organization workspace
                </p>
                <h1 className="mt-2 text-3xl font-semibold text-[var(--color-ink-strong)]">
                  {session
                    ? `${session.organization.name} credential operations`
                    : "Secure workspace"}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
                  This dashboard is now wired to the live backend flows for
                  registration, login, vault management, and contract-scoped share
                  links. The public consume flow is also testable from here.
                </p>
              </div>

              <div className="grid min-w-[220px] gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-muted)]">
                <p>
                  <span className="font-semibold text-[var(--color-ink-strong)]">
                    Role:
                  </span>{" "}
                  {session?.user.role || "unknown"}
                </p>
                <p>
                  <span className="font-semibold text-[var(--color-ink-strong)]">
                    Secrets:
                  </span>{" "}
                  {secrets.length}
                </p>
                <p>
                  <span className="font-semibold text-[var(--color-ink-strong)]">
                    Share links:
                  </span>{" "}
                  {shareLinks.length}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryCard
              note="Loaded from /api/secrets"
              title="Vault objects"
              value={String(secrets.length)}
            />
            <SummaryCard
              note="Active and unconsumed"
              title="Share links"
              value={String(activeShareLinks)}
            />
            <SummaryCard
              note="One-time links awaiting recipient action"
              title="View-once pending"
              value={String(viewOncePending)}
            />
          </div>

          <InlineMessage
            body={message}
            title="System response"
            tone={
              message.toLowerCase().includes("could not") ||
              message.toLowerCase().includes("required") ||
              message.toLowerCase().includes("expired") ||
              message.toLowerCase().includes("invalid")
                ? "error"
                : message.toLowerCase().includes("loaded") ||
                    message.toLowerCase().includes("created") ||
                    message.toLowerCase().includes("consumed") ||
                    message.toLowerCase().includes("rotated") ||
                    message.toLowerCase().includes("copied")
                  ? "success"
                  : "neutral"
            }
          />

          {activeView === "overview" ? (
            <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-3xl border border-[var(--color-dashboard-border)] bg-white p-6 shadow-[var(--shadow-card)]">
                <h2 className="text-lg font-semibold text-[var(--color-ink-strong)]">
                  Current identity
                </h2>
                {session ? (
                  <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                    <DashboardRow label="User" value={session.user.name} />
                    <DashboardRow label="Email" value={session.user.email} />
                    <DashboardRow label="Role" value={session.user.role} />
                    <DashboardRow
                      label="Email verified"
                      value={String(session.user.emailVerified)}
                    />
                    <DashboardRow
                      label="Organization"
                      value={session.organization.name}
                    />
                    <DashboardRow
                      label="Token expires"
                      value={formatInstant(session.expiresAt)}
                    />
                  </dl>
                ) : (
                  <EmptyPanel text="No stored session found. Return to login to continue." />
                )}
              </div>

              <div className="space-y-5">
                <StatusPanel
                  body={
                    activeSecret
                      ? `Current selected secret: ${activeSecret.secretKey}`
                      : "No secrets created yet."
                  }
                  title="Vault focus"
                />
                <StatusPanel
                  body={
                    lastCreatedShare
                      ? "A new share link was created in this session and is ready for public consume testing."
                      : "Create a share link to test the public recipient flow."
                  }
                  title="Share-link state"
                />
                <StatusPanel
                  body="Use the Vault tab to create, generate, reveal, rotate, and revoke secrets. Use Share links to issue recipient access under explicit contract permissions."
                  title="Operator path"
                />
              </div>
            </div>
          ) : null}

          {activeView === "vault" ? (
            <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
              <section className="space-y-5">
                <Panel title="Create secret">
                  <form className="space-y-4" onSubmit={handleCreateSecret}>
                    <TextField
                      label="Secret name"
                      onChange={setCreateName}
                      value={createName}
                    />
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
                      <button
                        className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={
                          actionBusy !== null ||
                          !generatorSupportedTypes.has(createType)
                        }
                        onClick={handleGenerateSecret}
                        type="button"
                      >
                        Generate
                      </button>
                    </div>
                    <button
                      className="w-full rounded-2xl bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={actionBusy !== null}
                      type="submit"
                    >
                      {actionBusy === "create-secret" ? "Creating..." : "Create secret"}
                    </button>
                  </form>
                </Panel>

                <Panel title="Vault inventory">
                  {secrets.length ? (
                    <div className="space-y-3">
                      {secrets.map((secret) => (
                        <button
                          className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                            selectedSecretId === secret.id
                              ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
                              : "border-[var(--color-border)] bg-white hover:border-[var(--color-brand)]"
                          }`}
                          key={secret.id}
                          onClick={() => setSelectedSecretId(secret.id)}
                          type="button"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-semibold text-[var(--color-ink-strong)]">
                                {secret.name}
                              </p>
                              <p className="mt-1 text-xs text-[var(--color-muted)]">
                                {secret.secretKey} · {secret.type}
                              </p>
                            </div>
                            <span className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-semibold text-[var(--color-ink)]">
                              {secret.status}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <EmptyPanel text="No secrets created yet. Use the create form to store the first vault object." />
                  )}
                </Panel>
              </section>

              <section className="space-y-5">
                <Panel title="Selected secret">
                  {selectedSecretDetail ? (
                    <div className="space-y-5">
                      <dl className="grid gap-4 sm:grid-cols-2">
                        <DashboardRow label="Name" value={selectedSecretDetail.name} />
                        <DashboardRow
                          label="Secret key"
                          value={selectedSecretDetail.secretKey}
                        />
                        <DashboardRow label="Type" value={selectedSecretDetail.type} />
                        <DashboardRow
                          label="Status"
                          value={selectedSecretDetail.status}
                        />
                        <DashboardRow
                          label="Version"
                          value={String(selectedSecretDetail.currentVersionNumber)}
                        />
                        <DashboardRow
                          label="Created at"
                          value={formatInstant(selectedSecretDetail.createdAt)}
                        />
                      </dl>

                      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-muted)]">
                        <p className="font-semibold text-[var(--color-ink-strong)]">
                          Description
                        </p>
                        <p className="mt-2 leading-6">
                          {selectedSecretDetail.description || "No description set."}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <ActionButton
                          busy={actionBusy === `reveal-${selectedSecretDetail.id}`}
                          label="Reveal current version"
                          onClick={() => handleRevealSecret(selectedSecretDetail.id)}
                        />
                        <ActionButton
                          busy={actionBusy === `revoke-${selectedSecretDetail.id}`}
                          label="Revoke secret"
                          onClick={() => handleRevokeSecret(selectedSecretDetail.id)}
                          tone="danger"
                        />
                      </div>

                      {revealedSecret ? (
                        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-[var(--color-ink-strong)]">
                                Revealed value
                              </p>
                              <p className="mt-1 text-xs text-[var(--color-muted)]">
                                Version {revealedSecret.versionNumber} ·
                                {" "}
                                {revealedSecret.secretKey}
                              </p>
                            </div>
                            <button
                              className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs font-medium text-[var(--color-ink)]"
                              onClick={() =>
                                copyText(revealedSecret.value, "Secret value")
                              }
                              type="button"
                            >
                              Copy
                            </button>
                          </div>
                          <textarea
                            className="mt-4 min-h-40 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm outline-none"
                            readOnly
                            value={revealedSecret.value}
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <EmptyPanel text="Select a secret from the vault inventory to view details, reveal it, rotate it, or revoke it." />
                  )}
                </Panel>

                <Panel title="Rotate active version">
                  {selectedSecretDetail ? (
                    <form className="space-y-4" onSubmit={handleRotateSecret}>
                      <TextAreaField
                        label="New secret value"
                        onChange={setRotateValue}
                        rows={5}
                        value={rotateValue}
                      />
                      <button
                        className="w-full rounded-2xl bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={actionBusy !== null}
                        type="submit"
                      >
                        {actionBusy === `rotate-${selectedSecretDetail.id}`
                          ? "Rotating..."
                          : "Rotate secret"}
                      </button>
                    </form>
                  ) : (
                    <EmptyPanel text="Rotation becomes available once a secret is selected." />
                  )}
                </Panel>
              </section>
            </div>
          ) : null}

          {activeView === "share" ? (
            <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
              <section className="space-y-5">
                <Panel title="Create share link">
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
                      label="Contract permission"
                      onChange={(value) =>
                        setSharePermission(value as ContractPermission)
                      }
                      options={contractPermissions}
                      value={sharePermission}
                    />
                    <TextField
                      label="Expires at"
                      onChange={setShareExpiry}
                      required={false}
                      type="datetime-local"
                      value={shareExpiry}
                    />
                    <button
                      className="w-full rounded-2xl bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={actionBusy !== null || !shareSecretId}
                      type="submit"
                    >
                      {actionBusy === "create-share-link"
                        ? "Creating..."
                        : "Create share link"}
                    </button>
                  </form>
                </Panel>

                <Panel title="Latest created share">
                  {lastCreatedShare ? (
                    <div className="space-y-4">
                      <CopyPanel
                        label="Frontend recipient URL"
                        value={lastCreatedShare.appUrl}
                        onCopy={() =>
                          copyText(lastCreatedShare.appUrl, "Frontend recipient URL")
                        }
                      />
                      <CopyPanel
                        label="Share token"
                        value={lastCreatedShare.token}
                        onCopy={() => copyText(lastCreatedShare.token, "Share token")}
                      />
                      <CopyPanel
                        label="Public metadata API URL"
                        value={lastCreatedShare.metadataUrl}
                        onCopy={() =>
                          copyText(lastCreatedShare.metadataUrl, "Metadata API URL")
                        }
                      />
                      <div className="flex flex-wrap gap-3">
                        <Link
                          className="rounded-2xl bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-strong)]"
                          href={lastCreatedShare.appUrl}
                          target="_blank"
                        >
                          Open recipient page
                        </Link>
                        <button
                          className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-brand)]"
                          onClick={() => {
                            setPublicToken(lastCreatedShare.token);
                            setActiveView("recipient");
                          }}
                          type="button"
                        >
                          Test consume in dashboard
                        </button>
                      </div>
                    </div>
                  ) : (
                    <EmptyPanel text="Create a share link and the one-time token plus recipient URL will be shown here once." />
                  )}
                </Panel>
              </section>

              <section className="space-y-5">
                <Panel title="Share-link inventory">
                  {shareLinks.length ? (
                    <div className="space-y-3">
                      {shareLinks.map((shareLink) => (
                        <div
                          className="rounded-2xl border border-[var(--color-border)] bg-white p-4"
                          key={shareLink.id}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="font-semibold text-[var(--color-ink-strong)]">
                                {shareLink.secretName}
                              </p>
                              <p className="mt-1 text-xs text-[var(--color-muted)]">
                                {shareLink.secretKey} · {shareLink.permission}
                              </p>
                              <p className="mt-2 text-sm text-[var(--color-muted)]">
                                Recipient: {shareLink.recipientLabel || "Unlabeled"}
                              </p>
                              <p className="mt-1 text-sm text-[var(--color-muted)]">
                                Created: {formatInstant(shareLink.createdAt)}
                              </p>
                              <p className="mt-1 text-sm text-[var(--color-muted)]">
                                Expires: {formatOptionalInstant(shareLink.expiresAt)}
                              </p>
                            </div>
                            <div className="flex flex-col items-start gap-3 sm:items-end">
                              <span className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-semibold text-[var(--color-ink)]">
                                {shareLink.status}
                              </span>
                              <button
                                className="rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-medium text-[var(--color-ink)] transition hover:border-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={actionBusy !== null}
                                onClick={() => handleRevokeShareLink(shareLink.id)}
                                type="button"
                              >
                                {actionBusy === `revoke-share-${shareLink.id}`
                                  ? "Revoking..."
                                  : "Revoke"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyPanel text="No share links exist yet. Create one to issue contract-scoped recipient access." />
                  )}
                </Panel>
              </section>
            </div>
          ) : null}

          {activeView === "recipient" ? (
            <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
              <section className="space-y-5">
                <Panel title="Public recipient flow">
                  <form className="space-y-4" onSubmit={handleLoadPublicMetadata}>
                    <TextAreaField
                      label="Share token"
                      onChange={setPublicToken}
                      rows={5}
                      value={publicToken}
                    />
                    <div className="flex flex-wrap gap-3">
                      <button
                        className="rounded-2xl bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={actionBusy !== null}
                        type="submit"
                      >
                        {actionBusy === "load-public-share"
                          ? "Loading..."
                          : "Load metadata"}
                      </button>
                      <Link
                        className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-brand)]"
                        href={`/access${publicToken ? `?token=${encodeURIComponent(publicToken)}` : ""}`}
                        target="_blank"
                      >
                        Open standalone page
                      </Link>
                    </div>
                  </form>
                </Panel>

                <Panel title="Recipient metadata">
                  {publicMetadata ? (
                    <dl className="grid gap-4 sm:grid-cols-2">
                      <DashboardRow
                        label="Organization"
                        value={publicMetadata.organizationName}
                      />
                      <DashboardRow
                        label="Secret name"
                        value={publicMetadata.secretName}
                      />
                      <DashboardRow
                        label="Type"
                        value={publicMetadata.secretType}
                      />
                      <DashboardRow
                        label="Permission"
                        value={publicMetadata.permission}
                      />
                      <DashboardRow
                        label="Status"
                        value={publicMetadata.status}
                      />
                      <DashboardRow
                        label="Can reveal"
                        value={String(publicMetadata.canReveal)}
                      />
                    </dl>
                  ) : (
                    <EmptyPanel text="Load public metadata here before testing reveal consumption." />
                  )}
                </Panel>
              </section>

              <section className="space-y-5">
                <Panel title="Consume shared secret">
                  {publicMetadata ? (
                    <div className="space-y-4">
                      <p className="text-sm leading-6 text-[var(--color-muted)]">
                        This triggers the public
                        {" "}
                        <code>/api/public/share-links/{"{token}"}/consume</code>
                        {" "}
                        path. View-once links will move to consumed state immediately.
                      </p>
                      <button
                        className="rounded-2xl bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={actionBusy !== null || !publicMetadata.canReveal}
                        onClick={handleConsumePublicShare}
                        type="button"
                      >
                        {actionBusy === "consume-public-share"
                          ? "Consuming..."
                          : "Consume share link"}
                      </button>
                    </div>
                  ) : (
                    <EmptyPanel text="Load a share token first. Metadata must be available before consume testing." />
                  )}
                </Panel>

                {publicConsumedValue ? (
                  <Panel title="Consumed secret payload">
                    <div className="space-y-4">
                      <dl className="grid gap-4 sm:grid-cols-2">
                        <DashboardRow
                          label="Secret key"
                          value={publicConsumedValue.secretKey}
                        />
                        <DashboardRow
                          label="Version"
                          value={String(publicConsumedValue.versionNumber)}
                        />
                        <DashboardRow
                          label="Permission"
                          value={publicConsumedValue.permission}
                        />
                        <DashboardRow
                          label="Status"
                          value={publicConsumedValue.status}
                        />
                      </dl>
                      <textarea
                        className="min-h-40 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm outline-none"
                        readOnly
                        value={publicConsumedValue.value}
                      />
                    </div>
                  </Panel>
                ) : null}
              </section>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  note,
}: {
  title: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-dashboard-border)] bg-white p-5 shadow-[var(--shadow-card)]">
      <p className="text-sm font-medium text-[var(--color-muted)]">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-[var(--color-ink-strong)]">
        {value}
      </p>
      <p className="mt-2 text-sm text-[var(--color-muted)]">{note}</p>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[var(--color-dashboard-border)] bg-white p-6 shadow-[var(--shadow-card)]">
      <h2 className="text-lg font-semibold text-[var(--color-ink-strong)]">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm leading-7 text-[var(--color-muted)]">
      {text}
    </div>
  );
}

function DashboardRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <dt className="text-sm font-medium text-[var(--color-muted)]">{label}</dt>
      <dd className="mt-2 break-words text-sm font-semibold text-[var(--color-ink-strong)]">
        {value}
      </dd>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  busy,
  tone = "default",
}: {
  label: string;
  onClick: () => void;
  busy?: boolean;
  tone?: "default" | "danger";
}) {
  return (
    <button
      className={`rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
        tone === "danger"
          ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
          : "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-strong)]"
      }`}
      disabled={busy}
      onClick={onClick}
      type="button"
    >
      {busy ? "Working..." : label}
    </button>
  );
}

function CopyPanel({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--color-ink-strong)]">
          {label}
        </p>
        <button
          className="rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-medium text-[var(--color-ink)]"
          onClick={onCopy}
          type="button"
        >
          Copy
        </button>
      </div>
      <p className="mt-3 break-all text-sm leading-6 text-[var(--color-muted)]">
        {value}
      </p>
    </div>
  );
}

function formatInstant(value?: string | null): string {
  if (!value) {
    return "Not available";
  }

  return new Date(value).toLocaleString();
}

function formatOptionalInstant(value?: string | null): string {
  return value ? formatInstant(value) : "No expiry";
}
