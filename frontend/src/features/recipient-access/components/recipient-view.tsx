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
    <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
      <PageSection
        description="Load public metadata and consume a share token without an organization session."
        title="Recipient test"
      >
        <form className="space-y-4" onSubmit={onLoadMetadata}>
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
            <Button onClick={onConsume} type="button" variant="secondary">
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
                onClick={() => void copyText(publicConsumedValue.value, "Consumed secret value")}
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
  );
}
