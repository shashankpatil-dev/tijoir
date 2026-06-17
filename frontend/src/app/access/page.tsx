"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  apiRequest,
  readLastPublicToken,
  saveLastPublicToken,
  type ConsumeShareLinkResponse,
  type PublicShareLinkMetadataResponse,
} from "@/lib/auth-client";
import { AuthShell, StatusPanel } from "@/components/site-chrome";
import { BusyOverlay } from "@/components/ui/feedback";
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
        title: "Token required",
        description: "Paste a recipient token before checking access.",
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
        title: "Access loaded",
        description: `Access details for ${result.secretName} are available.`,
        tone: "success",
      });
    } catch (error) {
      const text =
        error instanceof Error ? error.message : "Could not check access";
      showToast({
        title: "Access check failed",
        description: text,
        tone: "error",
      });
    } finally {
      setBusy(null);
    }
  }

  async function consume() {
    if (!token.trim()) {
      showToast({
        title: "Token required",
        description: "Paste a recipient token before revealing the secret.",
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
        title: "Secret revealed",
        description: `${result.secretKey} was revealed successfully.`,
        tone: "success",
      });
    } catch (error) {
      const text =
        error instanceof Error ? error.message : "Could not reveal the secret";
      showToast({
        title: "Reveal failed",
        description: text,
        tone: "error",
      });
    } finally {
      setBusy(null);
    }
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      showToast({
        title: "Copied",
        description: `${label} copied to the clipboard.`,
        tone: "success",
      });
    } catch {
      showToast({
        title: "Copy failed",
        description: `${label} could not be copied.`,
        tone: "error",
      });
    }
  }

  return (
    <AuthShell
      aside={
        <div className="space-y-4">
          <StatusPanel
            body="This page is meant for the person receiving shared access. It does not require an organization login."
            title="Recipient access"
          />
          <StatusPanel
            body="View-once links are consumed after reveal. Rotation-notify links show access details without exposing the secret value."
            title="How access works"
          />
        </div>
      }
      description="Open a recipient token, inspect access details, and reveal the secret only if the shared contract still allows it."
      eyebrow="Recipient access"
      title="Open shared access"
    >
      <BusyOverlay
        body="Processing the recipient access step."
        title={busy === "consume" ? "Opening shared access" : "Checking access"}
        visible={busy !== null}
      />
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
