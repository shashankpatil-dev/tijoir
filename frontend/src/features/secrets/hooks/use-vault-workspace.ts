import { FormEvent, useEffect, useMemo, useState } from "react";
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
  const [selectedSecretDetail, setSelectedSecretDetail] = useState<SecretDetail | null>(null);
  const [revealedSecret, setRevealedSecret] = useState<RevealSecretResponse | null>(null);
  const [createSecretOpen, setCreateSecretOpen] = useState(false);
  const [rotateDialogOpen, setRotateDialogOpen] = useState(false);
  const [secretRevokeTarget, setSecretRevokeTarget] = useState<SecretSummary | null>(null);

  const [createName, setCreateName] = useState("Vendor API Key");
  const [createType, setCreateType] = useState<SecretType>("API_KEY");
  const [createDescription, setCreateDescription] = useState(
    "Used by the primary integration vendor",
  );
  const [createValue, setCreateValue] = useState("");
  const [generateLength, setGenerateLength] = useState("32");
  const [rotateValue, setRotateValue] = useState("");

  const [vaultSearch, setVaultSearch] = useState("");
  const [vaultStatusFilter, setVaultStatusFilter] = useState("ALL");
  const [vaultTypeFilter, setVaultTypeFilter] = useState("ALL");
  const [vaultPage, setVaultPage] = useState(1);

  useEffect(() => {
    if (!secrets.length) {
      setSelectedSecretId("");
      setSelectedSecretDetail(null);
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
    void loadSecretDetail(selectedSecretId, sessionAccessToken);
  }, [selectedSecretId, sessionAccessToken]);

  useEffect(() => {
    setVaultPage(1);
  }, [vaultSearch, vaultStatusFilter, vaultTypeFilter]);

  const activeSecret = useMemo(
    () => secrets.find((secret) => secret.id === selectedSecretId) || null,
    [secrets, selectedSecretId],
  );

  const filteredSecrets = useMemo(() => {
    const query = vaultSearch.trim().toLowerCase();
    return secrets.filter((secret) => {
      const matchesQuery =
        !query ||
        secret.name.toLowerCase().includes(query) ||
        secret.secretKey.toLowerCase().includes(query) ||
        secret.type.toLowerCase().includes(query);
      const matchesStatus = vaultStatusFilter === "ALL" || secret.status === vaultStatusFilter;
      const matchesType = vaultTypeFilter === "ALL" || secret.type === vaultTypeFilter;
      return matchesQuery && matchesStatus && matchesType;
    });
  }, [secrets, vaultSearch, vaultStatusFilter, vaultTypeFilter]);

  const paginatedSecrets = paginate(filteredSecrets, vaultPage, DASHBOARD_ITEMS_PER_PAGE);
  const vaultPageCount = pageCount(filteredSecrets.length, DASHBOARD_ITEMS_PER_PAGE);
  const secretColumns = useMemo<DataTableColumn<SecretSummary>[]>(() => buildSecretColumns(), []);

  async function loadSecretDetail(secretId: string, accessToken: string) {
    try {
      const detail = await fetchSecretDetail(secretId, accessToken);
      setSelectedSecretDetail(detail);
      setRevealedSecret((current) => (current?.id === secretId ? current : null));
      setRotateValue("");
    } catch (error) {
      handleSessionError(error, "Could not load secret details");
    }
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
      const created = await createSecret(sessionAccessToken, {
        name: createName,
        type: createType,
        description: createDescription || null,
        value: createValue,
      });

      setCreateValue("");
      setCreateSecretOpen(false);
      setSelectedSecretId(created.id);
      router.push("/dashboard/vault");
      await loadWorkspace(sessionAccessToken);
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
      const result = await generateSecretValue(sessionAccessToken, {
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
      const result = await revealSecret(secretId, sessionAccessToken);
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
      await rotateSecret(selectedSecretId, sessionAccessToken, rotateValue);
      setRotateValue("");
      setRotateDialogOpen(false);
      setRevealedSecret(null);
      await loadWorkspace(sessionAccessToken);
      await loadSecretDetail(selectedSecretId, sessionAccessToken);
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
      await revokeSecret(secretId, sessionAccessToken);
      setRevealedSecret(null);
      await loadWorkspace(sessionAccessToken);
      if (secretId === selectedSecretId) {
        await loadSecretDetail(secretId, sessionAccessToken);
      }
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
    setCreateSecretOpen(true);
  }

  return {
    activeSecret,
    createDescription,
    createName,
    createSecretOpen,
    createType,
    createValue,
    filteredSecrets,
    generateLength,
    handleCreateSecret,
    handleGenerateSecret,
    handleRevealSecret,
    handleRevokeSecret,
    handleRotateSecret,
    openCreateSecret,
    paginatedSecrets,
    revealedSecret,
    rotateDialogOpen,
    rotateValue,
    secretColumns,
    secretRevokeTarget,
    selectedSecretDetail,
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
    selectedSecretId,
    vaultPage,
    vaultPageCount,
    vaultSearch,
    vaultStatusFilter,
    vaultTypeFilter,
  };
}
