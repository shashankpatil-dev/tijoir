"use client";

import { useEffect } from "react";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useDashboardWorkspaceContext } from "@/features/dashboard/components/dashboard-workspace-context";
import { CreateSecretDialog } from "@/features/secrets/components/create-secret-dialog";
import { RotateSecretDialog } from "@/features/secrets/components/rotate-secret-dialog";
import { VaultView } from "@/features/secrets/components/vault-view";
import { useVaultWorkspace } from "@/features/secrets/hooks/use-vault-workspace";
import {
  GENERATOR_SUPPORTED_SECRET_TYPES,
  SECRET_TYPES,
} from "@/features/secrets/types/secrets.types";

export default function DashboardVaultPage() {
  const shell = useDashboardWorkspaceContext();
  const vault = useVaultWorkspace({
    handleSessionError: shell.handleSessionError,
    router: shell.router,
    sessionAccessToken: shell.session?.accessToken ?? undefined,
    setActionBusy: shell.setActionBusy,
    setMessage: shell.setMessage,
    showToast: shell.showToast,
  });

  useEffect(
    () => shell.registerRefreshHandler(vault.refreshVault),
    [shell, vault.refreshVault],
  );

  useEffect(() => {
    if (shell.consumeIntent("create-secret")) {
      vault.setCreateSecretOpen(true);
    }
  }, [shell, vault]);

  return (
    <>
      <VaultView
        filteredSecretsLength={vault.filteredSecretsLength}
        loadingWorkspace={vault.loadingVault}
        onCopyRevealedSecret={shell.copyText}
        onCreateSecret={() => vault.setCreateSecretOpen(true)}
        onRevealSecret={(secretId) => void vault.handleRevealSecret(secretId)}
        onRevokeSecret={() => vault.setSecretRevokeTarget(vault.activeSecret)}
        onRotateSecret={() => vault.setRotateDialogOpen(true)}
        onSelectSecret={(secret) => vault.setSelectedSecretId(secret.id)}
        paginatedSecrets={vault.paginatedSecrets}
        revealedSecret={vault.revealedSecret}
        secretColumns={vault.secretColumns}
        secrets={vault.paginatedSecrets}
        secretTypeOptions={SECRET_TYPES}
        selectedSecretDetail={vault.selectedSecretDetail}
        selectedSecretLoading={vault.selectedSecretLoading}
        selectedSecretId={vault.selectedSecretId}
        setVaultPage={vault.setVaultPage}
        setVaultSearch={vault.setVaultSearch}
        setVaultStatusFilter={vault.setVaultStatusFilter}
        setVaultTypeFilter={vault.setVaultTypeFilter}
        vaultPage={vault.vaultPage}
        vaultPageCount={vault.vaultPageCount}
        vaultSearch={vault.vaultSearch}
        vaultStatusFilter={vault.vaultStatusFilter}
        vaultTypeFilter={vault.vaultTypeFilter}
      />

      <CreateSecretDialog
        actionBusy={shell.actionBusy}
        createDescription={vault.createDescription}
        createName={vault.createName}
        createType={vault.createType}
        createValue={vault.createValue}
        generateLength={vault.generateLength}
        generatorEnabled={GENERATOR_SUPPORTED_SECRET_TYPES.has(vault.createType)}
        onClose={() => vault.setCreateSecretOpen(false)}
        onGenerate={() => void vault.handleGenerateSecret()}
        onSubmit={vault.handleCreateSecret}
        open={vault.createSecretOpen}
        secretTypes={SECRET_TYPES}
        setCreateDescription={vault.setCreateDescription}
        setCreateName={vault.setCreateName}
        setCreateType={vault.setCreateType}
        setCreateValue={vault.setCreateValue}
        setGenerateLength={vault.setGenerateLength}
      />

      <RotateSecretDialog
        actionBusy={shell.actionBusy}
        onClose={() => vault.setRotateDialogOpen(false)}
        onSubmit={vault.handleRotateSecret}
        open={vault.rotateDialogOpen}
        rotateValue={vault.rotateValue}
        setRotateValue={vault.setRotateValue}
      />

      <ConfirmDialog
        confirmLabel="Revoke secret"
        description={
          vault.secretRevokeTarget
            ? `Revoke ${vault.secretRevokeTarget.secretKey}. This should stop future reveal access for the active vault entry.`
            : ""
        }
        onClose={() => vault.setSecretRevokeTarget(null)}
        onConfirm={() => {
          if (vault.secretRevokeTarget) {
            void vault.handleRevokeSecret(vault.secretRevokeTarget.id);
          }
          vault.setSecretRevokeTarget(null);
        }}
        open={Boolean(vault.secretRevokeTarget)}
        title="Revoke vault secret"
      />
    </>
  );
}
