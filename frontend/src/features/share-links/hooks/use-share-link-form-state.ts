import { useEffect, useState } from "react";
import type { ContractPermission } from "@/features/share-links/types/share-links.types";
import type { SecretSummary } from "@/features/secrets/types/secrets.types";

export function useShareLinkFormState(
  secrets: SecretSummary[],
  options?: {
    createShareOpen?: boolean;
    setCreateShareOpen?: (value: boolean) => void;
  },
) {
  const [internalCreateShareOpen, internalSetCreateShareOpen] = useState(false);
  const [shareSecretId, setShareSecretId] = useState("");
  const [shareVendorId, setShareVendorId] = useState("");
  const [shareContractId, setShareContractId] = useState("");
  const [shareRecipientLabel, setShareRecipientLabel] = useState(
    "Primary vendor operator",
  );
  const [sharePermission, setSharePermission] =
    useState<ContractPermission>("VIEW_ONCE");
  const [shareExpiry, setShareExpiry] = useState("");
  const createShareOpen = options?.createShareOpen ?? internalCreateShareOpen;
  const setCreateShareOpen = options?.setCreateShareOpen ?? internalSetCreateShareOpen;

  useEffect(() => {
    if (!secrets.length) {
      setShareSecretId("");
      return;
    }
    setShareSecretId((current) =>
      current && secrets.some((secret) => secret.id === current) ? current : secrets[0].id,
    );
  }, [secrets]);

  return {
    createShareOpen,
    setCreateShareOpen,
    setShareContractId,
    setShareExpiry,
    setSharePermission,
    setShareRecipientLabel,
    setShareSecretId,
    setShareVendorId,
    shareContractId,
    shareExpiry,
    sharePermission,
    shareRecipientLabel,
    shareSecretId,
    shareVendorId,
  };
}
