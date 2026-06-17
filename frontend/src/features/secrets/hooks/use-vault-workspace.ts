import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DataTableColumn } from "@/components/ui/data-table";
import {
  buildSecretColumns,
} from "@/features/dashboard/lib/dashboard-columns";
import {
  DASHBOARD_ITEMS_PER_PAGE,
  pageCount,
  paginate,
} from "@/features/dashboard/lib/dashboard-pagination";
import {
  createSecret,
  fetchSecretDetail,
  fetchSecretsPage,
  generateSecretValue,
  revealSecret,
  revokeSecret,
  rotateSecret,
} from "@/features/secrets/api/secrets.api";
import { dashboardQueryKeys } from "@/features/dashboard/lib/query-keys";
import { useSecretFormState } from "@/features/secrets/hooks/use-secret-form-state";
import type {
  RevealSecretResponse,
  SecretDetail,
  SecretSummary,
  SecretType,
} from "@/features/secrets/types/secrets.types";
import type { RouterLike, ShowToast } from "@/features/dashboard/hooks/workspace.types";

export function useVaultWorkspace({
  handleSessionError,
  loadWorkspace,
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
  loadWorkspace: (accessToken: string) => Promise<void>;
  router: RouterLike;
  secrets: SecretSummary[];
  selectedSecretId: string;
  sessionAccessToken?: string;
  setActionBusy: (value: string | null) => void;
  setMessage: (value: string) => void;
  setSelectedSecretId: (value: string) => void;
  showToast: ShowToast;
}) {
  const queryClient = useQueryClient();
  const [revealedSecret, setRevealedSecret] = useState<RevealSecretResponse | null>(null);
  const [secretRevokeTarget, setSecretRevokeTarget] = useState<SecretSummary | null>(null);
  const formState = useSecretFormState();

  const [vaultSearch, setVaultSearch] = useState("");
  const [vaultStatusFilter, setVaultStatusFilter] = useState("ALL");
  const [vaultTypeFilter, setVaultTypeFilter] = useState("ALL");
  const [vaultPage, setVaultPage] = useState(1);

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

  useEffect(() => {
    setVaultPage(1);
  }, [vaultSearch, vaultStatusFilter, vaultTypeFilter]);

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
        name: formState.createName,
        type: formState.createType,
        description: formState.createDescription || null,
        value: formState.createValue,
      });

      formState.setCreateValue("");
      formState.setCreateSecretOpen(false);
      setSelectedSecretId(created.id);
      router.push("/dashboard/vault");
      await queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.secrets(sessionAccessToken),
      });
      await queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.secretsPage(sessionAccessToken, {
          page: vaultPage - 1,
          size: DASHBOARD_ITEMS_PER_PAGE,
          query: vaultSearch,
          type: vaultTypeFilter,
          status: vaultStatusFilter,
        }),
      });
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
        type: formState.createType,
        length: Number.parseInt(formState.generateLength, 10),
      });

      formState.setCreateValue(result.value);
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
        value: formState.rotateValue,
      });
      formState.setRotateValue("");
      formState.setRotateDialogOpen(false);
      setRevealedSecret(null);
      await Promise.all([
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
        queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.secretDetail(sessionAccessToken, selectedSecretId),
        }),
      ]);
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
      await Promise.all([
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
        queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.secretDetail(sessionAccessToken, secretId),
        }),
      ]);
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

  function openCreateSecret() {
    router.push("/dashboard/vault");
    formState.setCreateSecretOpen(true);
  }

  return {
    activeSecret,
    ...formState,
    filteredSecrets,
    handleCreateSecret,
    handleGenerateSecret,
    handleRevealSecret,
    handleRevokeSecret,
    handleRotateSecret,
    openCreateSecret,
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
