import { useEffect, useState } from "react";
import type { ContractPermission } from "@/features/share-links/types/share-links.types";
import type { SecretSummary } from "@/features/secrets/types/secrets.types";

export function useShareLinkFormState(secrets: SecretSummary[]) {
  const [createShareOpen, setCreateShareOpen] = useState(false);
  const [shareSecretId, setShareSecretId] = useState("");
  const [shareRecipientLabel, setShareRecipientLabel] = useState(
    "Primary vendor operator",
  );
  const [sharePermission, setSharePermission] =
    useState<ContractPermission>("VIEW_ONCE");
  const [shareExpiry, setShareExpiry] = useState("");

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
    setShareExpiry,
    setSharePermission,
    setShareRecipientLabel,
    setShareSecretId,
    shareExpiry,
    sharePermission,
    shareRecipientLabel,
    shareSecretId,
  };
}
