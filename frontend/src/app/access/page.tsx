"use client";

import { type FormEvent, useEffect, useState } from "react";
import {
  apiRequest,
  readLastPublicToken,
  saveLastPublicToken,
  type ConsumeShareLinkResponse,
  type PublicShareLinkMetadataResponse,
} from "@/lib/auth-client";
import { AuthShell, StatusPanel } from "@/components/site-chrome";
import { useToast } from "@/components/ui/toast-provider";
import { RecipientView } from "@/features/recipient-access/components/recipient-view";

export default function AccessPage() {
  const { showToast } = useToast();
  const [token, setToken] = useState("");
  const [metadata, setMetadata] = useState<PublicShareLinkMetadataResponse | null>(
    null,
  );
  const [consumedValue, setConsumedValue] =
    useState<ConsumeShareLinkResponse | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const search = new URLSearchParams(window.location.search);
    const initialToken = search.get("token") || readLastPublicToken();
    if (!initialToken) {
      return;
    }
    setToken(initialToken);
    void loadMetadata(initialToken);
  }, []);

  async function handleLoadMetadata(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    await loadMetadata(token);
  }

  async function loadMetadata(rawToken: string) {
    if (!rawToken.trim()) {
      showToast({
        title: "Link needed",
        description: "Paste the link or token you were given.",
        tone: "warning",
      });
      return;
    }

    setBusy("metadata");
    try {
      const result = await apiRequest<PublicShareLinkMetadataResponse>(
        `/api/public/share-links/${rawToken.trim()}`,
      );
      saveLastPublicToken(rawToken.trim());
      setMetadata(result);
      setConsumedValue(null);
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
    if (!token.trim()) {
      showToast({
        title: "Link needed",
        description: "Paste the link or token before revealing.",
        tone: "warning",
      });
      return;
    }

    setBusy("consume");
    try {
      const result = await apiRequest<ConsumeShareLinkResponse>(
        `/api/public/share-links/${token.trim()}/consume`,
        { method: "POST" },
      );
      saveLastPublicToken(token.trim());
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
    <AuthShell
      aside={
        <div className="space-y-4">
          <StatusPanel
            title="You've been sent a secret"
            body="No account needed — open the link, and reveal it when you're ready."
          />
          <StatusPanel
            title="Handle with care"
            body="One-time links can be opened only once. Copy the value somewhere safe before you close this page."
          />
        </div>
      }
      description="Open the link you were given and reveal the secret securely."
      eyebrow="Shared with you"
      title="Open your shared secret"
    >
      {busy ? (
        <p className="mb-4 text-sm text-(--color-brand-strong)">
          {busy === "consume" ? "Revealing…" : "Checking the link…"}
        </p>
      ) : null}
      <RecipientView
        copyText={copyText}
        onConsume={consume}
        onLoadMetadata={handleLoadMetadata}
        publicConsumedValue={consumedValue}
        publicMetadata={metadata}
        publicToken={token}
        setPublicToken={setToken}
      />
    </AuthShell>
  );
}
