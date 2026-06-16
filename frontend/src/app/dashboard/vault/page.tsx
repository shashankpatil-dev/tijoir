"use client";

import { useDashboardWorkspaceContext } from "@/features/dashboard/components/dashboard-workspace-context";
import { VaultView } from "@/features/secrets/components/vault-view";
import { SECRET_TYPES } from "@/features/secrets/types/secrets.types";

export default function DashboardVaultPage() {
  const workspace = useDashboardWorkspaceContext();

  return (
    <VaultView
      filteredSecretsLength={workspace.filteredSecrets.length}
      loadingWorkspace={workspace.loadingWorkspace}
      onCopyRevealedSecret={workspace.copyText}
      onCreateSecret={() => workspace.setCreateSecretOpen(true)}
      onRevealSecret={(secretId) => void workspace.handleRevealSecret(secretId)}
      onRevokeSecret={() => workspace.setSecretRevokeTarget(workspace.activeSecret)}
      onRotateSecret={() => workspace.setRotateDialogOpen(true)}
      onSelectSecret={(secret) => workspace.setSelectedSecretId(secret.id)}
      paginatedSecrets={workspace.paginatedSecrets}
      revealedSecret={workspace.revealedSecret}
      secretColumns={workspace.secretColumns}
      secrets={workspace.secrets}
      secretTypeOptions={SECRET_TYPES}
      selectedSecretDetail={workspace.selectedSecretDetail}
      selectedSecretId={workspace.selectedSecretId}
      setVaultPage={workspace.setVaultPage}
      setVaultSearch={workspace.setVaultSearch}
      setVaultStatusFilter={workspace.setVaultStatusFilter}
      setVaultTypeFilter={workspace.setVaultTypeFilter}
      vaultPage={workspace.vaultPage}
      vaultPageCount={workspace.vaultPageCount}
      vaultSearch={workspace.vaultSearch}
      vaultStatusFilter={workspace.vaultStatusFilter}
      vaultTypeFilter={workspace.vaultTypeFilter}
    />
  );
}
