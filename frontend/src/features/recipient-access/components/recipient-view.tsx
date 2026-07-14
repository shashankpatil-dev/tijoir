"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Copy,
  Eye,
  KeyRound,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  ConsumeShareLinkResponse,
  PublicShareLinkMetadataResponse,
} from "@/features/recipient-access/types/recipient-access.types";

export function RecipientView({
  busy,
  copyText,
  onConsume,
  onLoadMetadata,
  publicConsumedValue,
  publicMetadata,
  publicToken,
  setPublicToken,
}: {
  busy?: string | null;
  copyText: (value: string, label: string) => Promise<void>;
  onConsume: () => void;
  onLoadMetadata: (event?: FormEvent<HTMLFormElement>) => void;
  publicConsumedValue: ConsumeShareLinkResponse | null;
  publicMetadata: PublicShareLinkMetadataResponse | null;
  publicToken: string;
  setPublicToken: (value: string) => void;
}) {
  const revealed = publicConsumedValue !== null;
  const oneTime = publicMetadata?.permission === "VIEW_ONCE";

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_24px_60px_-30px_rgba(13,34,64,0.4)]">
        {/* Header band */}
        <div className="flex items-center gap-3 border-b border-border bg-[linear-gradient(135deg,var(--color-brand-panel),#ffffff)] px-6 py-5">
          <span className="flex size-11 items-center justify-center rounded-full bg-(--color-brand) text-white">
            <Lock className="size-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-(--color-brand-strong)">
              Secure delivery
            </p>
            <h1 className="text-lg font-semibold text-(--color-ink-strong)">
              {revealed
                ? "Here's your secret"
                : publicMetadata
                  ? `${publicMetadata.organizationName} shared a secret with you`
                  : "Open a shared secret"}
            </h1>
          </div>
        </div>

        <div className="px-6 py-6">
          {revealed && publicConsumedValue ? (
            <RevealedSecret
              consumed={publicConsumedValue}
              copyText={copyText}
            />
          ) : publicMetadata ? (
            <MetadataStep
              busy={busy ?? null}
              metadata={publicMetadata}
              onConsume={onConsume}
              oneTime={oneTime}
            />
          ) : (
            <TokenStep
              busy={busy ?? null}
              onLoadMetadata={onLoadMetadata}
              publicToken={publicToken}
              setPublicToken={setPublicToken}
            />
          )}
        </div>
      </div>

      {/* Conversion nudge */}
      <Link
        className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-border bg-white/80 px-5 py-4 shadow-(--shadow-card) transition hover:border-(--color-brand) hover:bg-white"
        href="/signup"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-(--color-brand-soft) text-(--color-brand-strong)">
            <Sparkles className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-(--color-ink-strong)">
              Delivered securely by Tijoir
            </p>
            <p className="text-xs text-muted">
              Create your own encrypted, one-time links — free.
            </p>
          </div>
        </div>
        <ArrowRight className="size-4 text-(--color-brand-strong)" />
      </Link>
    </div>
  );
}

function TokenStep({
  busy,
  onLoadMetadata,
  publicToken,
  setPublicToken,
}: {
  busy: string | null;
  onLoadMetadata: (event?: FormEvent<HTMLFormElement>) => void;
  publicToken: string;
  setPublicToken: (value: string) => void;
}) {
  return (
    <form className="space-y-4" onSubmit={onLoadMetadata}>
      <p className="text-sm leading-6 text-muted">
        Paste the link or token you were sent to see what's waiting for you.
      </p>
      <textarea
        className="w-full rounded-xl border border-border bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-(--color-brand) focus:ring-4 focus:ring-(--color-brand-ring)"
        onChange={(event) => setPublicToken(event.target.value)}
        placeholder="Paste your access token"
        rows={3}
        value={publicToken}
      />
      <Button className="w-full" disabled={busy === "metadata"} type="submit">
        {busy === "metadata" ? "Checking…" : "Continue"}
      </Button>
    </form>
  );
}

function MetadataStep({
  busy,
  metadata,
  onConsume,
  oneTime,
}: {
  busy: string | null;
  metadata: PublicShareLinkMetadataResponse;
  onConsume: () => void;
  oneTime: boolean;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-(--color-surface) p-4">
        <Row icon={KeyRound} label="Secret" value={metadata.secretName} />
        <Row icon={Building2} label="From" value={metadata.organizationName} />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone={statusTone(metadata.secretType)}>{metadata.secretType}</Badge>
          <Badge tone={statusTone(metadata.permission)}>{metadata.permission}</Badge>
          <Badge tone={statusTone(metadata.status)}>{metadata.status}</Badge>
        </div>
      </div>

      {oneTime ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <Eye className="mt-0.5 size-4 shrink-0" />
          <p className="text-sm leading-6">
            This is a <strong>one-time</strong> link. It can be opened only once —
            copy the value somewhere safe before you close this page.
          </p>
        </div>
      ) : null}

      {metadata.canReveal ? (
        <Button
          className="w-full"
          disabled={busy === "consume"}
          onClick={onConsume}
          type="button"
        >
          {busy === "consume" ? "Revealing…" : "Reveal secret"}
        </Button>
      ) : (
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-(--color-surface) p-4 text-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          <p className="text-sm leading-6">
            This link shares details only — the secret value isn't exposed here.
          </p>
        </div>
      )}
    </div>
  );
}

function RevealedSecret({
  consumed,
  copyText,
}: {
  consumed: ConsumeShareLinkResponse;
  copyText: (value: string, label: string) => Promise<void>;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-(--color-ink-strong)">
          {consumed.secretName}
        </span>
        <Badge tone={statusTone(consumed.secretType)}>{consumed.secretType}</Badge>
      </div>

      <div className="rounded-2xl border border-border bg-(--color-ink-strong) p-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-blue-100/80">
          {consumed.secretKey}
        </p>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all font-mono text-sm leading-6">
          {consumed.value}
        </pre>
      </div>

      <Button
        className="w-full"
        onClick={() => void copyText(consumed.value, "Secret value")}
        type="button"
        variant="secondary"
      >
        <Copy className="size-4" />
        Copy value
      </Button>

      <p className="text-center text-xs leading-5 text-muted">
        Paste it into the right place now — one-time links can't be opened again.
      </p>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof KeyRound;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-(--color-brand-strong)">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted">{label}</p>
        <p className="truncate text-sm font-semibold text-(--color-ink-strong)">
          {value}
        </p>
      </div>
    </div>
  );
}
