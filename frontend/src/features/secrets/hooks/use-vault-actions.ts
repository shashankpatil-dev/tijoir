import type { FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { RouterLike, ShowToast } from "@/features/dashboard/hooks/workspace.types";
import {
  createSecret,
  generateSecretValue,
  revealSecret,
  revokeSecret,
  rotateSecret,
} from "@/features/secrets/api/secrets.api";
import { invalidateVaultQueries } from "@/features/secrets/hooks/vault-query-utils";
import type {
  RevealSecretResponse,
  SecretSummary,
  SecretType,
} from "@/features/secrets/types/secrets.types";

type VaultFormStateLike = {
  createDescription: string;
  createName: string;
  createSecretOpen: boolean;
  createType: SecretType;
  createValue: string;
  generateLength: string;
  rotateValue: string;
  setCreateSecretOpen: (value: boolean) => void;
  setCreateValue: (value: string) => void;
  setRotateDialogOpen: (value: boolean) => void;
  setRotateValue: (value: string) => void;
};

export function useVaultActions({
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
}: {
  formState: VaultFormStateLike;
  handleSessionError: (error: unknown, fallback: string) => void;
  router: RouterLike;
  sessionAccessToken?: string;
  setActionBusy: (value: string | null) => void;
  setMessage: (value: string) => void;
  setRevealedSecret: (value: RevealSecretResponse | null) => void;
  setSelectedSecretId: (value: string) => void;
  showToast: ShowToast;
  vaultPage: number;
  vaultSearch: string;
  vaultStatusFilter: string;
  vaultTypeFilter: string;
}) {
  const queryClient = useQueryClient();

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
      await invalidateVaultQueries({
        accessToken: sessionAccessToken,
        page: vaultPage,
        queryClient,
        search: vaultSearch,
        status: vaultStatusFilter,
        type: vaultTypeFilter,
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

  async function handleRotateSecret(
    event: FormEvent<HTMLFormElement>,
    selectedSecretId: string,
  ) {
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
      await invalidateVaultQueries({
        accessToken: sessionAccessToken,
        page: vaultPage,
        queryClient,
        search: vaultSearch,
        secretId: selectedSecretId,
        status: vaultStatusFilter,
        type: vaultTypeFilter,
      });
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
      await invalidateVaultQueries({
        accessToken: sessionAccessToken,
        page: vaultPage,
        queryClient,
        search: vaultSearch,
        secretId,
        status: vaultStatusFilter,
        type: vaultTypeFilter,
      });
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
    handleCreateSecret,
    handleGenerateSecret,
    handleRevealSecret,
    handleRevokeSecret,
    handleRotateSecret,
    openCreateSecret,
  };
}
