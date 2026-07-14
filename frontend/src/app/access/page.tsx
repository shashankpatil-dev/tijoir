"use client";

import { type FormEvent, useEffect, useState } from "react";
import {
  apiRequest,
  readLastPublicToken,
  saveLastPublicToken,
  type ConsumeShareLinkResponse,
  type PublicShareLinkMetadataResponse,
} from "@/lib/auth-client";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
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
    <div className="flex min-h-screen flex-col bg-[linear-gradient(180deg,#f8fbff_0%,var(--color-surface)_50%,#edf4ff_100%)] text-(--color-ink)">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <RecipientView
          busy={busy}
          copyText={copyText}
          onConsume={consume}
          onLoadMetadata={handleLoadMetadata}
          publicConsumedValue={consumedValue}
          publicMetadata={metadata}
          publicToken={token}
          setPublicToken={setToken}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
