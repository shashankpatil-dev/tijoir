import {
  DefinitionRows,
  EmptyState,
  PageSection,
} from "@/components/dashboard/dashboard-shell";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import {
  FilterSelect,
  PaginationControls,
  SearchInput,
  TableToolbar,
} from "@/components/ui/table-controls";
import { SurfaceNote } from "@/features/dashboard/components/surface-note";
import type {
  RevealSecretResponse,
  SecretDetail,
  SecretSummary,
  SecretType,
} from "@/features/secrets/types/secrets.types";

export function VaultView({
  filteredSecretsLength,
  loadingWorkspace,
  onCopyRevealedSecret,
  onCreateSecret,
  onRevealSecret,
  onRevokeSecret,
  onRevokeSecretRow,
  onRotateSecret,
  onRotateSecretRow,
  onSelectSecret,
  paginatedSecrets,
  revealedSecret,
  secretColumns,
  secrets,
  secretTypeOptions,
  selectedSecretDetail,
  selectedSecretLoading,
  selectedSecretId,
  setVaultPage,
  setVaultSearch,
  setVaultStatusFilter,
  setVaultTypeFilter,
  vaultPage,
  vaultPageCount,
  vaultSearch,
  vaultStatusFilter,
  vaultTypeFilter,
}: {
  filteredSecretsLength: number;
  loadingWorkspace: boolean;
  onCopyRevealedSecret: (value: string, label: string) => Promise<void>;
  onCreateSecret: () => void;
  onRevealSecret: (secretId: string) => void;
  onRevokeSecret: () => void;
  onRevokeSecretRow: (secret: SecretSummary) => void;
  onRotateSecret: () => void;
  onRotateSecretRow: (secret: SecretSummary) => void;
  onSelectSecret: (secret: SecretSummary) => void;
  paginatedSecrets: SecretSummary[];
  revealedSecret: RevealSecretResponse | null;
  secretColumns: DataTableColumn<SecretSummary>[];
  secrets: SecretSummary[];
  secretTypeOptions: SecretType[];
  selectedSecretDetail: SecretDetail | null;
  selectedSecretLoading: boolean;
  selectedSecretId: string;
  setVaultPage: (page: number) => void;
  setVaultSearch: (value: string) => void;
  setVaultStatusFilter: (value: string) => void;
  setVaultTypeFilter: (value: string) => void;
  vaultPage: number;
  vaultPageCount: number;
  vaultSearch: string;
  vaultStatusFilter: string;
  vaultTypeFilter: string;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <PageSection title="Vault inventory">
        <div className="space-y-4">
          <TableToolbar
            actions={
              <Button onClick={onCreateSecret} type="button">
                Create secret
              </Button>
            }
          >
            <SearchInput
              onChange={setVaultSearch}
              placeholder="Search by secret name, key, or type"
              value={vaultSearch}
            />
            <FilterSelect
              onChange={setVaultStatusFilter}
              options={[
                { label: "All statuses", value: "ALL" },
                { label: "Active", value: "ACTIVE" },
                { label: "Revoked", value: "REVOKED" },
              ]}
              value={vaultStatusFilter}
            />
            <FilterSelect
              onChange={setVaultTypeFilter}
              options={[
                { label: "All types", value: "ALL" },
                ...secretTypeOptions.map((type) => ({ label: type, value: type })),
              ]}
              value={vaultTypeFilter}
            />
          </TableToolbar>

          <DataTable
            containerClassName="max-h-120"
            columns={secretColumns}
            data={paginatedSecrets}
            emptyDescription="Create the first vault entry to begin the secret lifecycle."
            emptyTitle="No secrets match the current filters"
            loading={loadingWorkspace && !secrets.length}
            onRowClick={onSelectSecret}
            rowActions={(secret) => [
              {
                label: "Reveal",
                onClick: () => onRevealSecret(secret.id),
              },
              {
                label: "Rotate",
                onClick: () => onRotateSecretRow(secret),
              },
              {
                destructive: true,
                label: "Revoke",
                onClick: () => onRevokeSecretRow(secret),
              },
            ]}
            rowKey={(secret) => secret.id}
            selectedRowKey={selectedSecretId}
          />

          <PaginationControls
            currentPage={vaultPage}
            itemLabel="secrets"
            onPageChange={setVaultPage}
            pageCount={vaultPageCount}
            totalItems={filteredSecretsLength}
          />
        </div>
      </PageSection>

      <div className="space-y-5">
        <PageSection title="Selected secret">
          {selectedSecretLoading ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    className="h-20 animate-pulse rounded-2xl bg-(--color-surface-strong)"
                    key={index}
                  />
                ))}
              </div>
              <div className="h-24 animate-pulse rounded-2xl bg-(--color-surface-strong)" />
            </div>
          ) : selectedSecretDetail ? (
            <div className="space-y-5">
              <DefinitionRows
                items={[
                  { label: "Name", value: selectedSecretDetail.name },
                  { label: "Key", value: selectedSecretDetail.secretKey },
                  { label: "Type", value: selectedSecretDetail.type },
                  {
                    label: "Status",
                    value: (
                      <Badge tone={statusTone(selectedSecretDetail.status)}>
                        {selectedSecretDetail.status}
                      </Badge>
                    ),
                  },
                  {
                    label: "Active version",
                    value: `v${selectedSecretDetail.currentVersionNumber}`,
                  },
                  {
                    label: "Created by",
                    value: `${selectedSecretDetail.createdByName} · ${selectedSecretDetail.createdByEmail}`,
                  },
                ]}
              />

              {selectedSecretDetail.description ? (
                <SurfaceNote
                  label="Description"
                  value={selectedSecretDetail.description}
                />
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => onRevealSecret(selectedSecretDetail.id)}
                  type="button"
                  variant="primary"
                >
                  Reveal value
                </Button>
                <Button onClick={onRotateSecret} type="button" variant="secondary">
                  Rotate
                </Button>
                <Button onClick={onRevokeSecret} type="button" variant="outline">
                  Revoke
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState
              description="Pick a vault row to load the current detail and actions."
              title="No secret selected"
            />
          )}
        </PageSection>

        <PageSection title="Reveal output">
          {revealedSecret ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-(--color-ink-strong) p-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-blue-100/80">
                  Secret value
                </p>
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all text-sm leading-6">
                  {revealedSecret.value}
                </pre>
              </div>
              <Button
                onClick={() => void onCopyRevealedSecret(revealedSecret.value, "Secret value")}
                type="button"
                variant="secondary"
              >
                Copy secret value
              </Button>
            </div>
          ) : (
            <EmptyState
              description="Reveal the selected secret only when the current workflow actually requires the raw value."
              title="No revealed value"
            />
          )}
        </PageSection>
      </div>
    </div>
  );
}
