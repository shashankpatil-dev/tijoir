import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { DataTableColumn } from "@/components/ui/data-table";
import { buildSecretColumns } from "@/features/dashboard/lib/dashboard-columns";
import {
  DASHBOARD_ITEMS_PER_PAGE,
  pageCount,
} from "@/features/dashboard/lib/dashboard-pagination";
import { dashboardQueryKeys } from "@/features/dashboard/lib/query-keys";
import type { RouterLike, ShowToast } from "@/features/dashboard/hooks/workspace.types";
import {
  fetchSecretDetail,
  fetchSecretsPage,
} from "@/features/secrets/api/secrets.api";
import { useVaultActions } from "@/features/secrets/hooks/use-vault-actions";
import { useSecretFormState } from "@/features/secrets/hooks/use-secret-form-state";
import { useVaultListState } from "@/features/secrets/hooks/use-vault-list-state";
import type {
  RevealSecretResponse,
  SecretDetail,
  SecretSummary,
  SecretType,
} from "@/features/secrets/types/secrets.types";

export function useVaultWorkspace({
  handleSessionError,
  router,
  sessionAccessToken,
  setActionBusy,
  setMessage,
  showToast,
}: {
  handleSessionError: (error: unknown, fallback: string) => void;
  router: RouterLike;
  sessionAccessToken?: string;
  setActionBusy: (value: string | null) => void;
  setMessage: (value: string) => void;
  showToast: ShowToast;
}) {
  const queryClient = useQueryClient();
  const [selectedSecretId, setSelectedSecretId] = useState("");
  const [revealedSecret, setRevealedSecret] = useState<RevealSecretResponse | null>(null);
  const [secretRevokeTarget, setSecretRevokeTarget] = useState<SecretSummary | null>(null);
  const formState = useSecretFormState();
  const {
    setVaultPage,
    setVaultSearch,
    setVaultStatusFilter,
    setVaultTypeFilter,
    vaultPage,
    vaultSearch,
    vaultStatusFilter,
    vaultTypeFilter,
  } = useVaultListState();

  const secretListQuery = useQuery({
    queryKey: dashboardQueryKeys.secretsPage(sessionAccessToken, {
      page: vaultPage - 1,
      size: DASHBOARD_ITEMS_PER_PAGE,
      query: vaultSearch,
      type: vaultTypeFilter,
      status: vaultStatusFilter,
    }),
    queryFn: () =>
      fetchSecretsPage(sessionAccessToken as string, {
        page: vaultPage - 1,
        size: DASHBOARD_ITEMS_PER_PAGE,
        query: vaultSearch.trim() || undefined,
        type: vaultTypeFilter === "ALL" ? undefined : (vaultTypeFilter as SecretType),
        status: vaultStatusFilter === "ALL" ? undefined : vaultStatusFilter,
      }),
    enabled: Boolean(sessionAccessToken),
    placeholderData: (previous) => previous,
  });

  useEffect(() => {
    if (secretListQuery.error) {
      handleSessionError(secretListQuery.error, "Could not load secrets");
    }
  }, [handleSessionError, secretListQuery.error]);

  const paginatedSecrets = secretListQuery.data?.items ?? [];
  const filteredSecretsLength = secretListQuery.data?.totalElements ?? paginatedSecrets.length;
  const vaultPageCount =
    secretListQuery.data?.totalPages ?? pageCount(paginatedSecrets.length, DASHBOARD_ITEMS_PER_PAGE);

  useEffect(() => {
    if (!paginatedSecrets.length) {
      setSelectedSecretId("");
      setRevealedSecret(null);
      return;
    }

    if (!selectedSecretId || !paginatedSecrets.some((secret) => secret.id === selectedSecretId)) {
      setSelectedSecretId(paginatedSecrets[0].id);
    }
  }, [paginatedSecrets, selectedSecretId]);

  useEffect(() => {
    if (!sessionAccessToken || !selectedSecretId) {
      return;
    }
    setRevealedSecret((current) => (current?.id === selectedSecretId ? current : null));
    formState.setRotateValue("");
  }, [formState, selectedSecretId, sessionAccessToken]);

  const activeSecret = useMemo(
    () => paginatedSecrets.find((secret) => secret.id === selectedSecretId) || null,
    [paginatedSecrets, selectedSecretId],
  );

  const secretColumns = useMemo<DataTableColumn<SecretSummary>[]>(() => buildSecretColumns(), []);

  const secretDetailQuery = useQuery({
    queryKey: dashboardQueryKeys.secretDetail(sessionAccessToken, selectedSecretId),
    queryFn: () => fetchSecretDetail(selectedSecretId, sessionAccessToken as string),
    enabled: Boolean(sessionAccessToken && selectedSecretId),
  });

  useEffect(() => {
    if (secretDetailQuery.error) {
      handleSessionError(secretDetailQuery.error, "Could not load secret detail");
    }
  }, [handleSessionError, secretDetailQuery.error]);

  const selectedSecretDetail: SecretDetail | null = secretDetailQuery.data ?? null;

  const vaultActions = useVaultActions({
    formState,
    handleSessionError,
    router,
    sessionAccessToken,
    setActionBusy,
    setMessage,
    setRevealedSecret,
    setSelectedSecretId,
    showToast,
    vaultPage,
    vaultSearch,
    vaultStatusFilter,
    vaultTypeFilter,
  });

  async function handleRotateSecret(event: FormEvent<HTMLFormElement>) {
    await vaultActions.handleRotateSecret(event, selectedSecretId);
  }

  async function refreshVault() {
    if (!sessionAccessToken) {
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "secrets-page", sessionAccessToken],
      }),
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "secret-detail", sessionAccessToken],
      }),
    ]);
  }

  return {
    activeSecret,
    ...formState,
    filteredSecretsLength,
    ...vaultActions,
    handleRotateSecret,
    loadingVault: secretListQuery.isLoading,
    paginatedSecrets,
    refreshVault,
    revealedSecret,
    secretColumns,
    secretRevokeTarget,
    selectedSecretDetail,
    selectedSecretId,
    selectedSecretLoading: secretDetailQuery.isLoading && Boolean(selectedSecretId),
    setSecretRevokeTarget,
    setSelectedSecretId,
    setVaultPage,
    setVaultSearch,
    setVaultStatusFilter,
    setVaultTypeFilter,
    vaultPage,
    vaultPageCount,
    vaultSearch,
    vaultStatusFilter,
    vaultTypeFilter,
  };
}
