import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DataTableColumn } from "@/components/ui/data-table";
import { buildSecretColumns } from "@/features/dashboard/lib/dashboard-columns";
import {
  DASHBOARD_ITEMS_PER_PAGE,
  pageCount,
} from "@/features/dashboard/lib/dashboard-pagination";
import { dashboardQueryKeys } from "@/features/dashboard/lib/query-keys";
import type { RouterLike, ShowToast } from "@/features/dashboard/hooks/workspace.types";
import {
  createSecret,
  fetchSecretDetail,
  fetchSecretsPage,
  generateSecretValue,
  revealSecret,
  revokeSecret,
  rotateSecret,
} from "@/features/secrets/api/secrets.api";
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
  const [vaultSearch, setVaultSearch] = useState("");
  const [vaultStatusFilter, setVaultStatusFilter] = useState("ALL");
  const [vaultTypeFilter, setVaultTypeFilter] = useState("ALL");
  const [vaultPage, setVaultPage] = useState(1);
  const [createSecretOpen, setCreateSecretOpen] = useState(false);
  const [rotateDialogOpen, setRotateDialogOpen] = useState(false);
  const [createName, setCreateName] = useState("Vendor API Key");
  const [createType, setCreateType] = useState<SecretType>("API_KEY");
  const [createDescription, setCreateDescription] = useState(
    "Used by the primary integration vendor",
  );
  const [createValue, setCreateValue] = useState("");
  const [generateLength, setGenerateLength] = useState("32");
  const [rotateValue, setRotateValue] = useState("");

  useEffect(() => {
    setVaultPage(1);
  }, [vaultSearch, vaultStatusFilter, vaultTypeFilter]);

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
    secretListQuery.data?.totalPages ??
    pageCount(paginatedSecrets.length, DASHBOARD_ITEMS_PER_PAGE);

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
    setRotateValue("");
  }, [selectedSecretId, sessionAccessToken]);

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

  const createSecretMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      type: SecretType;
      description: string | null;
      value: string;
    }) => createSecret(sessionAccessToken as string, payload),
  });

  const generateSecretMutation = useMutation({
    mutationFn: (payload: { type: SecretType; length: number }) =>
      generateSecretValue(sessionAccessToken as string, payload),
  });

  const revealSecretMutation = useMutation({
    mutationFn: (secretId: string) => revealSecret(secretId, sessionAccessToken as string),
  });

  const rotateSecretMutation = useMutation({
    mutationFn: (payload: { secretId: string; value: string }) =>
      rotateSecret(payload.secretId, sessionAccessToken as string, payload.value),
  });

  const revokeSecretMutation = useMutation({
    mutationFn: (secretId: string) => revokeSecret(secretId, sessionAccessToken as string),
  });

  async function invalidateVault(secretId?: string) {
    if (!sessionAccessToken) {
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.dashboardSummary(sessionAccessToken),
      }),
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.secrets(sessionAccessToken),
      }),
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.secretsPage(sessionAccessToken, {
          page: vaultPage - 1,
          size: DASHBOARD_ITEMS_PER_PAGE,
          query: vaultSearch,
          type: vaultTypeFilter,
          status: vaultStatusFilter,
        }),
      }),
      ...(secretId
        ? [
            queryClient.invalidateQueries({
              queryKey: dashboardQueryKeys.secretDetail(sessionAccessToken, secretId),
            }),
          ]
        : []),
    ]);
  }

  async function handleCreateSecret(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionAccessToken) {
      router.replace("/login");
      return;
    }

    setActionBusy("create-secret");
    setMessage("Creating secret");

    try {
      const created = await createSecretMutation.mutateAsync({
        name: createName,
        type: createType,
        description: createDescription || null,
        value: createValue,
      });
      setCreateValue("");
      setCreateSecretOpen(false);
      setSelectedSecretId(created.id);
      await invalidateVault(created.id);
      setMessage(`Secret ${created.secretKey} created.`);
      showToast({
        title: "Secret created",
        description: `${created.secretKey} is now stored in the vault.`,
        tone: "success",
      });
    } catch (error) {
      handleSessionError(error, "Could not create secret");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleGenerateSecret() {
    if (!sessionAccessToken) {
      router.replace("/login");
      return;
    }

    setActionBusy("generate-secret");
    setMessage("Generating candidate value");

    try {
      const result = await generateSecretMutation.mutateAsync({
        type: createType,
        length: Number.parseInt(generateLength, 10),
      });
      setCreateValue(result.value);
      setMessage(`Generated ${result.type} candidate with length ${result.length}.`);
      showToast({
        title: "Value generated",
        description: `${result.type} candidate generated for the create form.`,
        tone: "success",
      });
    } catch (error) {
      handleSessionError(error, "Could not generate candidate value");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleRevealSecret(secretId: string) {
    if (!sessionAccessToken) {
      router.replace("/login");
      return;
    }

    setActionBusy(`reveal-${secretId}`);
    setMessage("Revealing current secret version");

    try {
      const result = await revealSecretMutation.mutateAsync(secretId);
      setRevealedSecret(result);
      setMessage(`Revealed ${result.secretKey} version ${result.versionNumber}.`);
      showToast({
        title: "Secret revealed",
        description: `${result.secretKey} version ${result.versionNumber} was loaded.`,
        tone: "success",
      });
    } catch (error) {
      handleSessionError(error, "Could not reveal secret");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleRotateSecret(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionAccessToken || !selectedSecretId) {
      return;
    }

    setActionBusy(`rotate-${selectedSecretId}`);
    setMessage("Rotating secret");

    try {
      await rotateSecretMutation.mutateAsync({
        secretId: selectedSecretId,
        value: rotateValue,
      });
      setRotateValue("");
      setRotateDialogOpen(false);
      setRevealedSecret(null);
      await invalidateVault(selectedSecretId);
      setMessage("Secret rotated and active version updated.");
      showToast({
        title: "Secret rotated",
        description: "The active secret version was updated successfully.",
        tone: "success",
      });
    } catch (error) {
      handleSessionError(error, "Could not rotate secret");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleRevokeSecret(secretId: string) {
    if (!sessionAccessToken) {
      router.replace("/login");
      return;
    }

    setActionBusy(`revoke-${secretId}`);
    setMessage("Revoking secret");

    try {
      await revokeSecretMutation.mutateAsync(secretId);
      setRevealedSecret(null);
      await invalidateVault(secretId);
      setMessage("Secret revoked.");
      showToast({
        title: "Secret revoked",
        description: "This vault secret can no longer be revealed.",
        tone: "warning",
      });
    } catch (error) {
      handleSessionError(error, "Could not revoke secret");
    } finally {
      setActionBusy(null);
    }
  }

  return {
    activeSecret,
    createDescription,
    createName,
    createSecretOpen,
    createType,
    createValue,
    filteredSecretsLength,
    generateLength,
    handleCreateSecret,
    handleGenerateSecret,
    handleRevealSecret,
    handleRevokeSecret,
    handleRotateSecret,
    loadingVault: secretListQuery.isLoading,
    paginatedSecrets,
    revealedSecret,
    rotateDialogOpen,
    rotateValue,
    secretColumns,
    secretRevokeTarget,
    selectedSecretDetail,
    selectedSecretId,
    selectedSecretLoading: secretDetailQuery.isLoading && Boolean(selectedSecretId),
    setCreateDescription,
    setCreateName,
    setCreateSecretOpen,
    setCreateType,
    setCreateValue,
    setGenerateLength,
    setRotateDialogOpen,
    setRotateValue,
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
