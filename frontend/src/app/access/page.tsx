"use client";

import { type FormEvent, useEffect, useState } from "react";
import {
  readLastPublicToken,
  saveLastPublicToken,
  type ConsumeShareLinkResponse,
  type CreatePublicSecretShareResponse,
  type PublicSecretShareManagementResponse,
  type PublicShareLinkMetadataResponse,
} from "@/lib/auth-client";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { useToast } from "@/components/ui/toast-provider";
import { RecipientView } from "@/features/recipient-access/components/recipient-view";
import {
  consumePublicShare,
  createPublicShare,
  fetchPublicShareManagement,
  fetchPublicShareMetadata,
  revokePublicShare,
} from "@/features/recipient-access/api/recipient-access.api";
import type { SecretType } from "@/features/secrets/types/secrets.types";

type PublicCreateForm = {
  secretName: string;
  secretKey: string;
  secretType: SecretType;
  value: string;
  senderLabel: string;
  recipientLabel: string;
  expiryPreset: "24h" | "72h" | "168h";
};

export default function AccessPage() {
  const { showToast } = useToast();
  const [mode, setMode] = useState<"open" | "create">("open");
  const [token, setToken] = useState("");
  const [manageToken, setManageToken] = useState("");
  const [metadata, setMetadata] = useState<PublicShareLinkMetadataResponse | null>(
    null,
  );
  const [consumedValue, setConsumedValue] =
    useState<ConsumeShareLinkResponse | null>(null);
  const [createdQuickShare, setCreatedQuickShare] =
    useState<CreatePublicSecretShareResponse | null>(null);
  const [managedQuickShare, setManagedQuickShare] =
    useState<PublicSecretShareManagementResponse | null>(null);
  const [createForm, setCreateForm] = useState<PublicCreateForm>({
    secretName: "",
    secretKey: "",
    secretType: "PASSWORD",
    value: "",
    senderLabel: "",
    recipientLabel: "",
    expiryPreset: "24h",
  });
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const search = new URLSearchParams(window.location.search);
    const managementToken = search.get("manage");
    const initialToken = search.get("token") || readLastPublicToken();
    const requestedMode = search.get("mode");
    if (managementToken) {
      setMode("create");
      setManageToken(managementToken);
      void loadManagement(managementToken);
      return;
    }
    if (requestedMode === "create") {
      setMode("create");
    }
    if (!initialToken) {
      return;
    }
    setMode("open");
    setToken(initialToken);
    void loadMetadata(initialToken);
  }, []);

  async function handleLoadMetadata(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    await loadMetadata(token);
  }

  async function loadMetadata(rawToken: string) {
    const normalizedToken = rawToken.trim();
    if (!normalizedToken) {
      showToast({
        title: "Link needed",
        description: "Paste the link or token you were given.",
        tone: "warning",
      });
      return;
    }

    setBusy("metadata");
    try {
      const result = await fetchPublicShareMetadata(normalizedToken);
      saveLastPublicToken(normalizedToken);
      syncAccessUrl({ token: normalizedToken });
      setMetadata(result);
      setConsumedValue(null);
      setCreatedQuickShare(null);
      setManagedQuickShare(null);
      setManageToken("");
      showToast({
        title: "Access found",
        description: `Details for ${result.secretName} are ready.`,
        tone: "success",
      });
    } catch (error) {
      const text = error instanceof Error ? error.message : "Couldn't open this link";
      showToast({ title: "Couldn't open link", description: text, tone: "error" });
    } finally {
      setBusy(null);
    }
  }

  async function consume() {
    const normalizedToken = token.trim();
    if (!normalizedToken) {
      showToast({
        title: "Link needed",
        description: "Paste the link or token before revealing.",
        tone: "warning",
      });
      return;
    }

    setBusy("consume");
    try {
      const result = await consumePublicShare(normalizedToken);
      saveLastPublicToken(normalizedToken);
      syncAccessUrl({ token: normalizedToken });
      setConsumedValue(result);
      showToast({
        title: "Revealed",
        description: `${result.secretKey} is shown below.`,
        tone: "success",
      });
    } catch (error) {
      const text = error instanceof Error ? error.message : "Couldn't reveal the secret";
      showToast({ title: "Reveal failed", description: text, tone: "error" });
    } finally {
      setBusy(null);
    }
  }

  async function createQuickShare() {
    if (!createForm.secretName.trim() || !createForm.secretKey.trim() || !createForm.value.trim()) {
      showToast({
        title: "Missing fields",
        description: "Secret name, secret key, and value are required.",
        tone: "warning",
      });
      return;
    }

    setBusy("create");
    try {
      const result = await createPublicShare({
        secretName: createForm.secretName.trim(),
        secretKey: createForm.secretKey.trim(),
        secretType: createForm.secretType,
        value: createForm.value,
        senderLabel: createForm.senderLabel.trim() || null,
        recipientLabel: createForm.recipientLabel.trim() || null,
        expiresAt: buildExpiryIso(createForm.expiryPreset),
      });
      setCreatedQuickShare(result);
      setToken(result.shareToken);
      setManageToken(result.manageToken);
      setMetadata(null);
      setConsumedValue(null);
      setManagedQuickShare({
        id: result.id,
        senderName: createForm.senderLabel.trim() || "Anonymous sender",
        secretName: createForm.secretName.trim(),
        secretKey: createForm.secretKey.trim(),
        status: "ACTIVE",
        expiresAt: result.expiresAt,
        consumedAt: null,
        canRevoke: true,
      });
      saveLastPublicToken(result.shareToken);
      syncAccessUrl({ manageToken: result.manageToken });
      showToast({
        title: "One-time link created",
        description: "Copy the link and send it to the recipient.",
        tone: "success",
      });
    } catch (error) {
      const text = error instanceof Error ? error.message : "Couldn't create the one-time link";
      showToast({ title: "Create failed", description: text, tone: "error" });
    } finally {
      setBusy(null);
    }
  }

  async function loadManagement(rawManageToken: string) {
    const normalizedToken = rawManageToken.trim();
    if (!normalizedToken) {
      return;
    }

    setBusy("manage");
    try {
      const result = await fetchPublicShareManagement(normalizedToken);
      setManageToken(normalizedToken);
      setMode("create");
      setManagedQuickShare(result);
      setCreatedQuickShare(null);
      setMetadata(null);
      setConsumedValue(null);
      syncAccessUrl({ manageToken: normalizedToken });
      showToast({
        title: "Management loaded",
        description: `Controls for ${result.secretName} are ready.`,
        tone: "success",
      });
    } catch (error) {
      const text =
        error instanceof Error ? error.message : "Couldn't open the management link";
      showToast({ title: "Couldn't open management link", description: text, tone: "error" });
    } finally {
      setBusy(null);
    }
  }

  async function revokeQuickShare() {
    const targetManageToken = createdQuickShare?.manageToken ?? manageToken.trim();
    if (!targetManageToken) {
      return;
    }

    setBusy("revoke");
    try {
      const result = await revokePublicShare(targetManageToken);
      setMetadata((current) =>
        current
          ? {
              ...current,
              status: result.status,
              canReveal: false,
            }
          : current,
      );
      setManagedQuickShare((current) =>
        current
          ? {
              ...current,
              status: result.status,
              consumedAt: result.consumedAt ?? current.consumedAt,
              canRevoke: false,
            }
          : current,
      );
      showToast({
        title: "Link revoked",
        description: "The recipient can no longer open this quick-share.",
        tone: "success",
      });
    } catch (error) {
      const text = error instanceof Error ? error.message : "Couldn't revoke the quick-share";
      showToast({ title: "Revoke failed", description: text, tone: "error" });
    } finally {
      setBusy(null);
    }
  }

  function handleModeChange(nextMode: "open" | "create") {
    setMode(nextMode);
    if (nextMode === "open") {
      syncAccessUrl({ token: token.trim() || undefined });
      return;
    }

    if (manageToken.trim()) {
      syncAccessUrl({ manageToken: manageToken.trim() });
    } else {
      syncAccessUrl({ mode: "create" });
    }
  }

  function resetManagementView() {
    setManagedQuickShare(null);
    setCreatedQuickShare(null);
    setManageToken("");
    syncAccessUrl({ mode: "create" });
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      showToast({ title: "Copied", description: `${label} copied.`, tone: "success" });
    } catch {
      showToast({
        title: "Copy failed",
        description: `Couldn't copy ${label.toLowerCase()}.`,
        tone: "error",
      });
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[linear-gradient(180deg,#f8fbff_0%,var(--color-surface)_50%,#edf4ff_100%)] text-(--color-ink)">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <RecipientView
          busy={busy}
          createdQuickShare={createdQuickShare}
          createForm={createForm}
          copyText={copyText}
          managedQuickShare={managedQuickShare}
          mode={mode}
          onCreateQuickShare={createQuickShare}
          onCreateAnother={resetManagementView}
          onRevokeQuickShare={revokeQuickShare}
          onConsume={consume}
          onLoadMetadata={handleLoadMetadata}
          publicConsumedValue={consumedValue}
          publicMetadata={metadata}
          publicManageToken={manageToken}
          publicToken={token}
          setCreateForm={setCreateForm}
          setMode={handleModeChange}
          setPublicToken={setToken}
        />
      </main>
      <SiteFooter />
    </div>
  );
}

function buildExpiryIso(preset: PublicCreateForm["expiryPreset"]) {
  const now = Date.now();
  const hours = preset === "24h" ? 24 : preset === "72h" ? 72 : 168;
  return new Date(now + hours * 60 * 60 * 1000).toISOString();
}

function syncAccessUrl({
  manageToken,
  mode,
  token,
}: {
  token?: string;
  manageToken?: string;
  mode?: "create";
}) {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  url.search = "";

  if (manageToken) {
    url.searchParams.set("mode", "create");
    url.searchParams.set("manage", manageToken);
  } else if (token) {
    url.searchParams.set("token", token);
  } else if (mode === "create") {
    url.searchParams.set("mode", "create");
  }

  window.history.replaceState(null, "", url.toString());
}
