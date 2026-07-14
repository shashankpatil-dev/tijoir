import type { FormEvent } from "react";
import {
  DetailList,
  EmptyState,
  PageSection,
} from "@/components/dashboard/dashboard-shell";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/form-fields";
import type {
  ConsumeShareLinkResponse,
  PublicShareLinkMetadataResponse,
} from "@/features/recipient-access/types/recipient-access.types";

export function RecipientView({
  copyText,
  onConsume,
  onLoadMetadata,
  publicConsumedValue,
  publicMetadata,
  publicToken,
  setPublicToken,
}: {
  copyText: (value: string, label: string) => Promise<void>;
  onConsume: () => void;
  onLoadMetadata: (event?: FormEvent<HTMLFormElement>) => void;
  publicConsumedValue: ConsumeShareLinkResponse | null;
  publicMetadata: PublicShareLinkMetadataResponse | null;
  publicToken: string;
  setPublicToken: (value: string) => void;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <PageSection
        description="Paste the token, review the access details, and reveal only when the package still allows it."
        title="Open recipient package"
      >
        <form className="space-y-4" onSubmit={onLoadMetadata}>
          <TextAreaField
            hint="Paste the token from the shared recipient package."
            label="Recipient token"
            onChange={setPublicToken}
            rows={5}
            value={publicToken}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <SurfaceStat
              label="Step 1"
              value="Check access"
              note="Confirm organization, secret type, status, and permission."
            />
            <SurfaceStat
              label="Step 2"
              value="Reveal if allowed"
              note="Only links with reveal permission can expose the secret value."
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="primary">
              Check access
            </Button>
            <Button onClick={onConsume} type="button" variant="secondary">
              Reveal secret
            </Button>
          </div>
        </form>
      </PageSection>

      <div className="space-y-5">
        <PageSection
          description="Access details are safe to inspect before the reveal step."
          title="Access details"
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
                {
                  label: "Reveal allowed",
                  value: publicMetadata.canReveal ? "Yes" : "No, metadata only",
                },
              ]}
            />
          ) : (
            <EmptyState
              description="Check access first to load the organization, permission, and status details."
              title="No access details yet"
            />
          )}
        </PageSection>

        <PageSection
          description="This area fills only after a successful reveal."
          title="Revealed value"
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
              <div className="rounded-2xl border border-border bg-(--color-ink-strong) p-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-blue-100/80">
                  Revealed value
                </p>
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all text-sm leading-6">
                  {publicConsumedValue.value}
                </pre>
              </div>
              <Button
                onClick={() => void copyText(publicConsumedValue.value, "Consumed secret value")}
                type="button"
                variant="secondary"
              >
                Copy value
              </Button>
            </div>
          ) : (
            <EmptyState
              description="Reveal the secret after checking access if the recipient package still allows it."
              title="No revealed value yet"
            />
          )}
        </PageSection>

        <PageSection
          description="A few recipient-side rules that keep the handoff clear and safe."
          title="Safe handling"
        >
          <div className="space-y-3">
            <SurfaceStat
              label="Before reveal"
              note="Confirm the organization, secret name, and expiry before opening the value."
              value="Inspect metadata"
            />
            <SurfaceStat
              label="After reveal"
              note="Copy the value into the target system promptly and avoid storing it in chat or notes."
              value="Use and close"
            />
          </div>
        </PageSection>
      </div>
    </div>
  );
}

function SurfaceStat({
  label,
  note,
  value,
}: {
  label: string;
  note: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-(--color-surface) p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-(--color-ink-strong)">{value}</p>
      <p className="mt-1 text-sm leading-5 text-muted">{note}</p>
    </div>
  );
}
