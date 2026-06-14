"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  apiRequest,
  type ConsumeShareLinkResponse,
  type PublicShareLinkMetadataResponse,
} from "@/lib/auth-client";
import { AuthShell, StatusPanel } from "@/components/site-chrome";

export default function AccessPage() {
  const [token, setToken] = useState("");
  const [metadata, setMetadata] = useState<PublicShareLinkMetadataResponse | null>(
    null,
  );
  const [consumedValue, setConsumedValue] =
    useState<ConsumeShareLinkResponse | null>(null);
  const [message, setMessage] = useState(
    "Load metadata first, then consume the shared secret if the contract allows it.",
  );
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const search = new URLSearchParams(window.location.search);
    const initialToken = search.get("token");
    if (!initialToken) {
      return;
    }

    setToken(initialToken);
    void loadMetadata(initialToken);
  }, []);

  async function handleLoadMetadata(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadMetadata(token);
  }

  async function loadMetadata(rawToken: string) {
    if (!rawToken.trim()) {
      setMessage("Enter a share token first.");
      return;
    }

    setBusy("metadata");
    setMessage("Loading share metadata");

    try {
      const result = await apiRequest<PublicShareLinkMetadataResponse>(
        `/api/public/share-links/${rawToken.trim()}`,
      );

      setMetadata(result);
      setConsumedValue(null);
      setMessage(`Loaded metadata for ${result.secretName}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load share metadata");
    } finally {
      setBusy(null);
    }
  }

  async function consume() {
    if (!token.trim()) {
      setMessage("Enter a share token first.");
      return;
    }

    setBusy("consume");
    setMessage("Consuming share link");

    try {
      const result = await apiRequest<ConsumeShareLinkResponse>(
        `/api/public/share-links/${token.trim()}/consume`,
        { method: "POST" },
      );

      setConsumedValue(result);
      setMessage(`Consumed ${result.secretKey} successfully.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not consume share link");
    } finally {
      setBusy(null);
    }
  }

  async function copyValue() {
    if (!consumedValue) {
      return;
    }

    try {
      await navigator.clipboard.writeText(consumedValue.value);
      setMessage("Secret value copied.");
    } catch {
      setMessage("Could not copy the secret value.");
    }
  }

  return (
    <AuthShell
      aside={
        <div className="space-y-4">
          <StatusPanel
            body="This page is the public recipient entry point for share links. It does not require login."
            title="Recipient flow"
          />
          <StatusPanel
            body="View-once links become consumed immediately after a successful reveal. Rotation-notify links show metadata but do not expose the secret payload."
            title="Contract behavior"
          />
        </div>
      }
      description="Open a share token, inspect its contract metadata, and reveal the secret if the link still allows it."
      eyebrow="Public access"
      title="Consume a shared secret"
    >
      <div className="space-y-6">
        <form className="space-y-4" onSubmit={handleLoadMetadata}>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-strong)]">
              Share access
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink-strong)]">
              Validate the link before reveal
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              This uses the public share-link APIs directly, without any organization session.
            </p>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-[var(--color-ink)]">
              Share token
            </span>
            <textarea
              className="mt-2 min-h-32 w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[var(--color-brand-ring)]"
              onChange={(event) => setToken(event.target.value)}
              required
              value={token}
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-2xl bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={busy !== null}
              type="submit"
            >
              {busy === "metadata" ? "Loading..." : "Load metadata"}
            </button>
            <Link
              className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-brand)]"
              href="/dashboard"
            >
              Back to dashboard
            </Link>
          </div>
        </form>

        <StatusPanel body={message} title="System response" />

        {metadata ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <h3 className="text-lg font-semibold text-[var(--color-ink-strong)]">
              Share metadata
            </h3>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <MetadataRow label="Organization" value={metadata.organizationName} />
              <MetadataRow label="Secret name" value={metadata.secretName} />
              <MetadataRow label="Secret type" value={metadata.secretType} />
              <MetadataRow label="Permission" value={metadata.permission} />
              <MetadataRow label="Status" value={metadata.status} />
              <MetadataRow label="Can reveal" value={String(metadata.canReveal)} />
              <MetadataRow
                label="Recipient"
                value={metadata.recipientLabel || "Unlabeled"}
              />
              <MetadataRow
                label="Expires"
                value={
                  metadata.expiresAt
                    ? new Date(metadata.expiresAt).toLocaleString()
                    : "No expiry"
                }
              />
            </dl>

            <div className="mt-5">
              <button
                className="rounded-2xl bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={busy !== null || !metadata.canReveal}
                onClick={consume}
                type="button"
              >
                {busy === "consume" ? "Consuming..." : "Reveal secret"}
              </button>
            </div>
          </div>
        ) : null}

        {consumedValue ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-ink-strong)]">
                  Secret payload
                </h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  {consumedValue.secretKey} · version {consumedValue.versionNumber}
                </p>
              </div>
              <button
                className="rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-medium text-[var(--color-ink)] transition hover:border-[var(--color-brand)]"
                onClick={copyValue}
                type="button"
              >
                Copy
              </button>
            </div>
            <textarea
              className="mt-4 min-h-40 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm outline-none"
              readOnly
              value={consumedValue.value}
            />
          </div>
        ) : null}
      </div>
    </AuthShell>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
      <dt className="text-sm font-medium text-[var(--color-muted)]">{label}</dt>
      <dd className="mt-2 break-words text-sm font-semibold text-[var(--color-ink-strong)]">
        {value}
      </dd>
    </div>
  );
}
