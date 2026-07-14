import {
  DefinitionRows,
  PageSection,
} from "@/components/dashboard/dashboard-shell";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  onCloseSecret,
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
  onCloseSecret: () => void;
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
    <>
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

      <Sheet
        open={Boolean(selectedSecretId)}
        onOpenChange={(open) => {
          if (!open) {
            onCloseSecret();
          }
        }}
      >
        <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
          <SheetHeader className="border-b border-[var(--color-dashboard-border)]">
            <SheetTitle>{selectedSecretDetail?.name ?? "Secret detail"}</SheetTitle>
            {selectedSecretDetail ? (
              <p className="text-sm text-[var(--color-muted)]">
                {selectedSecretDetail.secretKey}
              </p>
            ) : null}
          </SheetHeader>

          <div className="flex flex-col gap-5 p-4">
            {selectedSecretLoading ? (
              <div className="space-y-4">
                <div className="h-40 animate-pulse rounded-2xl bg-(--color-surface-strong)" />
                <div className="h-24 animate-pulse rounded-2xl bg-(--color-surface-strong)" />
              </div>
            ) : selectedSecretDetail ? (
              <>
                <DefinitionRows
                  items={[
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

                {revealedSecret ? (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-border bg-(--color-ink-strong) p-4 text-white">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-blue-100/80">
                        Secret value
                      </p>
                      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all text-sm leading-6">
                        {revealedSecret.value}
                      </pre>
                    </div>
                    <Button
                      onClick={() =>
                        void onCopyRevealedSecret(revealedSecret.value, "Secret value")
                      }
                      type="button"
                      variant="secondary"
                    >
                      Copy secret value
                    </Button>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
