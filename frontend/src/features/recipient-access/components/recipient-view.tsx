"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Copy,
  ExternalLink,
  Eye,
  KeyRound,
  Lock,
  PlusCircle,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SecretType } from "@/features/secrets/types/secrets.types";
import type {
  ConsumeShareLinkResponse,
  CreatePublicSecretShareResponse,
  PublicSecretShareManagementResponse,
  PublicShareLinkMetadataResponse,
} from "@/features/recipient-access/types/recipient-access.types";
import { SECRET_TYPES } from "@/features/secrets/types/secrets.types";

export function RecipientView({
  busy,
  createdQuickShare,
  createForm,
  copyText,
  managedQuickShare,
  mode,
  onCreateAnother,
  onCreateQuickShare,
  onRevokeQuickShare,
  onConsume,
  onLoadMetadata,
  publicConsumedValue,
  publicManageToken: _publicManageToken,
  publicMetadata,
  publicToken,
  setCreateForm,
  setMode,
  setPublicToken,
}: {
  busy?: string | null;
  createdQuickShare: CreatePublicSecretShareResponse | null;
  createForm: {
    secretName: string;
    secretKey: string;
    secretType: SecretType;
    value: string;
    senderLabel: string;
    recipientLabel: string;
    expiryPreset: "24h" | "72h" | "168h";
  };
  copyText: (value: string, label: string) => Promise<void>;
  managedQuickShare: PublicSecretShareManagementResponse | null;
  mode: "open" | "create";
  onCreateAnother: () => void;
  onCreateQuickShare: () => void;
  onRevokeQuickShare: () => void;
  onConsume: () => void;
  onLoadMetadata: (event?: FormEvent<HTMLFormElement>) => void;
  publicConsumedValue: ConsumeShareLinkResponse | null;
  publicManageToken: string;
  publicMetadata: PublicShareLinkMetadataResponse | null;
  publicToken: string;
  setCreateForm: (
    value:
      | {
          secretName: string;
          secretKey: string;
          secretType: SecretType;
          value: string;
          senderLabel: string;
          recipientLabel: string;
          expiryPreset: "24h" | "72h" | "168h";
        }
      | ((current: {
          secretName: string;
          secretKey: string;
          secretType: SecretType;
          value: string;
          senderLabel: string;
          recipientLabel: string;
          expiryPreset: "24h" | "72h" | "168h";
        }) => {
          secretName: string;
          secretKey: string;
          secretType: SecretType;
          value: string;
          senderLabel: string;
          recipientLabel: string;
          expiryPreset: "24h" | "72h" | "168h";
        }),
  ) => void;
  setMode: (value: "open" | "create") => void;
  setPublicToken: (value: string) => void;
}) {
  const revealed = publicConsumedValue !== null;
  const oneTime = publicMetadata?.permission === "VIEW_ONCE";
  const managingExistingQuickShare =
    managedQuickShare !== null && createdQuickShare === null;

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
              {mode === "create" ? "One-time link" : "Secure delivery"}
            </p>
            <h1 className="text-lg font-semibold text-(--color-ink-strong)">
              {mode === "create"
                ? "Create a public quick-share"
                : revealed
                  ? "Here's your secret"
                  : publicMetadata
                    ? `${publicMetadata.senderName} shared a secret with you`
                    : "Open a shared secret"}
            </h1>
          </div>
        </div>

        <div className="px-6 py-6">
          {mode === "create" ? (
            <div className="mb-5 rounded-2xl border border-(--color-brand-soft) bg-[linear-gradient(135deg,var(--color-brand-panel),#ffffff)] p-4">
              <p className="text-sm font-semibold text-(--color-ink-strong)">
                Send one password outside the workspace
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Use this only for one-off external delivery. Team sharing and vendor contracts
                still belong inside the workspace.
              </p>
            </div>
          ) : null}

          <div className="mb-5 inline-flex rounded-xl border border-border bg-(--color-surface) p-1">
            <button
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                mode === "open"
                  ? "bg-white text-(--color-ink-strong) shadow-sm"
                  : "text-muted hover:text-(--color-ink-strong)"
              }`}
              onClick={() => setMode("open")}
              type="button"
            >
              Open link
            </button>
            <button
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                mode === "create"
                  ? "bg-white text-(--color-ink-strong) shadow-sm"
                  : "text-muted hover:text-(--color-ink-strong)"
              }`}
              onClick={() => setMode("create")}
              type="button"
            >
              Create link
            </button>
          </div>

          {mode === "create" ? (
            <CreateStep
              busy={busy ?? null}
              copyText={copyText}
              createdQuickShare={createdQuickShare}
              createForm={createForm}
              managedQuickShare={managedQuickShare}
              managingExistingQuickShare={managingExistingQuickShare}
              onCreateAnother={onCreateAnother}
              onCreateQuickShare={onCreateQuickShare}
              onRevokeQuickShare={onRevokeQuickShare}
              setCreateForm={setCreateForm}
            />
          ) : revealed && publicConsumedValue ? (
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
        <Row icon={Building2} label="From" value={metadata.senderName} />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone={statusTone(metadata.secretType)}>{metadata.secretType}</Badge>
          <Badge tone={statusTone(metadata.permission)}>{metadata.permission}</Badge>
          <Badge tone={statusTone(metadata.status)}>{metadata.status}</Badge>
          <Badge tone={statusTone(metadata.sourceType)}>
            {metadata.sourceType === "ANONYMOUS" ? "PUBLIC LINK" : "ORG LINK"}
          </Badge>
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

function CreateStep({
  busy,
  copyText,
  createdQuickShare,
  createForm,
  managedQuickShare,
  managingExistingQuickShare,
  onCreateAnother,
  onCreateQuickShare,
  onRevokeQuickShare,
  setCreateForm,
}: {
  busy: string | null;
  copyText: (value: string, label: string) => Promise<void>;
  createdQuickShare: CreatePublicSecretShareResponse | null;
  createForm: {
    secretName: string;
    secretKey: string;
    secretType: SecretType;
    value: string;
    senderLabel: string;
    recipientLabel: string;
    expiryPreset: "24h" | "72h" | "168h";
  };
  managedQuickShare: PublicSecretShareManagementResponse | null;
  managingExistingQuickShare: boolean;
  onCreateAnother: () => void;
  onCreateQuickShare: () => void;
  onRevokeQuickShare: () => void;
  setCreateForm: (
    value:
      | {
          secretName: string;
          secretKey: string;
          secretType: SecretType;
          value: string;
          senderLabel: string;
          recipientLabel: string;
          expiryPreset: "24h" | "72h" | "168h";
        }
      | ((current: {
          secretName: string;
          secretKey: string;
          secretType: SecretType;
          value: string;
          senderLabel: string;
          recipientLabel: string;
          expiryPreset: "24h" | "72h" | "168h";
        }) => {
          secretName: string;
          secretKey: string;
          secretType: SecretType;
          value: string;
          senderLabel: string;
          recipientLabel: string;
          expiryPreset: "24h" | "72h" | "168h";
        }),
  ) => void;
}) {
  return (
    <div className="space-y-5">
      {managedQuickShare ? (
        <ManagementState
          busy={busy}
          createdQuickShare={createdQuickShare}
          management={managedQuickShare}
          onCreateAnother={onCreateAnother}
          onRevokeQuickShare={onRevokeQuickShare}
        />
      ) : null}

      {managingExistingQuickShare ? null : (
        <>
          <div className="rounded-2xl border border-border bg-(--color-surface) p-4">
            <p className="text-sm leading-6 text-muted">
              Create a one-time link for a password, API key, SSH credential, or token
              without logging in. It expires quickly and the value can be opened once.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Secret name"
              value={createForm.secretName}
              onChange={(value) => setCreateForm((current) => ({ ...current, secretName: value }))}
              placeholder="Production SFTP password"
            />
            <Field
              label="Secret key"
              value={createForm.secretKey}
              onChange={(value) => setCreateForm((current) => ({ ...current, secretKey: value }))}
              placeholder="vendor-sftp-password"
            />
            <Field
              label="Sender label"
              value={createForm.senderLabel}
              onChange={(value) => setCreateForm((current) => ({ ...current, senderLabel: value }))}
              placeholder="Your team name"
            />
            <Field
              label="Recipient label"
              value={createForm.recipientLabel}
              onChange={(value) => setCreateForm((current) => ({ ...current, recipientLabel: value }))}
              placeholder="Vendor operator"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-(--color-ink-strong)">Secret type</span>
              <select
                className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none transition focus:border-(--color-brand) focus:ring-4 focus:ring-(--color-brand-ring)"
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    secretType: event.target.value as SecretType,
                  }))
                }
                value={createForm.secretType}
              >
                {SECRET_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-(--color-ink-strong)">Expiry</span>
              <select
                className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none transition focus:border-(--color-brand) focus:ring-4 focus:ring-(--color-brand-ring)"
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    expiryPreset: event.target.value as "24h" | "72h" | "168h",
                  }))
                }
                value={createForm.expiryPreset}
              >
                <option value="24h">24 hours</option>
                <option value="72h">3 days</option>
                <option value="168h">7 days</option>
              </select>
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium text-(--color-ink-strong)">Secret value</span>
            <textarea
              className="min-h-36 w-full rounded-xl border border-border bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-(--color-brand) focus:ring-4 focus:ring-(--color-brand-ring)"
              onChange={(event) => setCreateForm((current) => ({ ...current, value: event.target.value }))}
              placeholder="Paste the value you need to send"
              value={createForm.value}
            />
          </label>

          <Button className="w-full" disabled={busy === "create"} onClick={onCreateQuickShare} type="button">
            <PlusCircle className="size-4" />
            {busy === "create" ? "Creating…" : "Create one-time link"}
          </Button>
        </>
      )}

      {createdQuickShare ? (
        <div className="space-y-3 rounded-2xl border border-border bg-white p-4">
          <div className="flex items-center gap-2">
            <Badge tone="brand">Ready</Badge>
            <p className="text-sm text-muted">
              Expires at {new Date(createdQuickShare.expiresAt).toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-(--color-surface) p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
              Access link
            </p>
            <p className="mt-2 break-all font-mono text-sm text-(--color-ink-strong)">
              {buildAccessUrl(createdQuickShare.shareToken)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-(--color-surface) p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
              Creator management link
            </p>
            <p className="mt-2 break-all font-mono text-sm text-(--color-ink-strong)">
              {buildManageUrl(createdQuickShare.manageToken)}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              onClick={() =>
                void copyText(
                  buildAccessUrl(createdQuickShare.shareToken),
                  "Access link",
                )
              }
              type="button"
              variant="secondary"
            >
              <Copy className="size-4" />
              Copy link
            </Button>
            <Button
              onClick={() => void copyText(createdQuickShare.shareToken, "Share token")}
              type="button"
              variant="secondary"
            >
              <ExternalLink className="size-4" />
              Copy token
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              onClick={() => void copyText(buildManageUrl(createdQuickShare.manageToken), "Management link")}
              type="button"
              variant="secondary"
            >
              <Copy className="size-4" />
              Copy manage link
            </Button>
            <Button
              disabled={busy === "revoke"}
              onClick={onRevokeQuickShare}
              type="button"
              variant="danger"
            >
              <ShieldAlert className="size-4" />
              {busy === "revoke" ? "Revoking…" : "Revoke link"}
            </Button>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
            <p className="text-xs font-semibold uppercase tracking-[0.08em]">
              Keep this private
            </p>
            <p className="mt-1 text-sm leading-6">
              Anyone with the management link can revoke the quick-share before it is opened.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ManagementState({
  busy,
  createdQuickShare,
  management,
  onCreateAnother,
  onRevokeQuickShare,
}: {
  busy: string | null;
  createdQuickShare: CreatePublicSecretShareResponse | null;
  management: PublicSecretShareManagementResponse;
  onCreateAnother: () => void;
  onRevokeQuickShare: () => void;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={statusTone(management.status)}>{management.status}</Badge>
        <p className="text-sm text-muted">
          Expires at {new Date(management.expiresAt).toLocaleString()}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-(--color-surface) p-4">
        <Row icon={KeyRound} label="Secret" value={management.secretName} />
        <Row icon={Lock} label="Key" value={management.secretKey} />
        <Row icon={Building2} label="Sender" value={management.senderName} />
        {management.consumedAt ? (
          <p className="mt-3 text-sm text-muted">
            Opened on {new Date(management.consumedAt).toLocaleString()}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        {management.canRevoke ? (
          <Button
            className="flex-1"
            disabled={busy === "revoke"}
            onClick={onRevokeQuickShare}
            type="button"
            variant="danger"
          >
            <ShieldAlert className="size-4" />
            {busy === "revoke" ? "Revoking…" : "Revoke link"}
          </Button>
        ) : null}
        {!createdQuickShare ? (
          <Button className="flex-1" onClick={onCreateAnother} type="button" variant="secondary">
            <PlusCircle className="size-4" />
            Create another link
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function buildAccessUrl(token: string) {
  if (typeof window === "undefined") {
    return `/access.html?token=${encodeURIComponent(token)}`;
  }
  return new URL(`/access.html?token=${encodeURIComponent(token)}`, window.location.origin).toString();
}

function buildManageUrl(token: string) {
  if (typeof window === "undefined") {
    return `/access.html?mode=create&manage=${encodeURIComponent(token)}`;
  }
  return new URL(
    `/access.html?mode=create&manage=${encodeURIComponent(token)}`,
    window.location.origin,
  ).toString();
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

function Field({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-(--color-ink-strong)">{label}</span>
      <input
        className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none transition focus:border-(--color-brand) focus:ring-4 focus:ring-(--color-brand-ring)"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
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
