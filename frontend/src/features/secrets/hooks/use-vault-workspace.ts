import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { DataTableColumn } from "@/components/ui/data-table";
import { buildSecretColumns } from "@/features/dashboard/lib/dashboard-columns";
import {
  DASHBOARD_ITEMS_PER_PAGE,
  pageCount,
} from "@/features/dashboard/lib/dashboard-pagination";
import {
  fetchSecretDetail,
  fetchSecretsPage,
} from "@/features/secrets/api/secrets.api";
import { dashboardQueryKeys } from "@/features/dashboard/lib/query-keys";
import { useVaultActions } from "@/features/secrets/hooks/use-vault-actions";
import { useSecretFormState } from "@/features/secrets/hooks/use-secret-form-state";
import { useVaultListState } from "@/features/secrets/hooks/use-vault-list-state";
import type {
  RevealSecretResponse,
  SecretDetail,
  SecretSummary,
  SecretType,
} from "@/features/secrets/types/secrets.types";
import type { RouterLike, ShowToast } from "@/features/dashboard/hooks/workspace.types";

export function useVaultWorkspace({
  handleSessionError,
  router,
  secrets,
  selectedSecretId,
  sessionAccessToken,
  setActionBusy,
  setMessage,
  setSelectedSecretId,
  showToast,
}: {
  handleSessionError: (error: unknown, fallback: string) => void;
  router: RouterLike;
  secrets: SecretSummary[];
  selectedSecretId: string;
  sessionAccessToken?: string;
  setActionBusy: (value: string | null) => void;
  setMessage: (value: string) => void;
  setSelectedSecretId: (value: string) => void;
  showToast: ShowToast;
}) {
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

  useEffect(() => {
    if (!secrets.length) {
      setSelectedSecretId("");
      setRevealedSecret(null);
      return;
    }

    if (!selectedSecretId || !secrets.some((secret) => secret.id === selectedSecretId)) {
      setSelectedSecretId(secrets[0].id);
    }
  }, [secrets, selectedSecretId, setSelectedSecretId]);

  useEffect(() => {
    if (!sessionAccessToken || !selectedSecretId) {
      return;
    }
    setRevealedSecret((current) => (current?.id === selectedSecretId ? current : null));
    formState.setRotateValue("");
  }, [selectedSecretId, sessionAccessToken]);

  const activeSecret = useMemo(
    () => secrets.find((secret) => secret.id === selectedSecretId) || null,
    [secrets, selectedSecretId],
  );

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
  const filteredSecrets = secretListQuery.data?.items ?? secrets;
  const paginatedSecrets = filteredSecrets;
  const vaultPageCount = secretListQuery.data?.totalPages ?? pageCount(secrets.length, DASHBOARD_ITEMS_PER_PAGE);
  const secretColumns = useMemo<DataTableColumn<SecretSummary>[]>(() => buildSecretColumns(), []);
  const secretDetailQuery = useQuery({
    queryKey: dashboardQueryKeys.secretDetail(sessionAccessToken, selectedSecretId),
    queryFn: () => fetchSecretDetail(selectedSecretId, sessionAccessToken as string),
    enabled: Boolean(sessionAccessToken && selectedSecretId),
  });
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

  return {
    activeSecret,
    ...formState,
    filteredSecrets,
    ...vaultActions,
    handleRotateSecret,
    paginatedSecrets,
    revealedSecret,
    secretColumns,
    selectedSecretLoading: secretDetailQuery.isLoading && Boolean(selectedSecretId),
    secretTotal: secretListQuery.data?.totalElements ?? secrets.length,
    secretRevokeTarget,
    selectedSecretDetail,
    setSecretRevokeTarget,
    setSelectedSecretId,
    setVaultPage,
    setVaultSearch,
    setVaultStatusFilter,
    setVaultTypeFilter,
    selectedSecretId,
    vaultPage,
    vaultPageCount,
    vaultSearch,
    vaultStatusFilter,
    vaultTypeFilter,
  };
}
