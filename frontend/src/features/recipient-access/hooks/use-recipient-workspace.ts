import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  consumePublicShare,
  fetchPublicShareMetadata,
  readLastPublicToken,
  saveLastPublicToken,
} from "@/features/recipient-access/api/recipient-access.api";
import type {
  ConsumeShareLinkResponse,
  PublicShareLinkMetadataResponse,
} from "@/features/recipient-access/types/recipient-access.types";
import type { ShowToast } from "@/features/dashboard/hooks/workspace.types";

export function useRecipientWorkspace({
  handleSessionError,
  setActionBusy,
  setMessage,
  showToast,
}: {
  handleSessionError: (error: unknown, fallback: string) => void;
  setActionBusy: (value: string | null) => void;
  setMessage: (value: string) => void;
  showToast: ShowToast;
}) {
  const queryClient = useQueryClient();
  const [publicToken, setPublicToken] = useState("");
  const [publicMetadata, setPublicMetadata] =
    useState<PublicShareLinkMetadataResponse | null>(null);
  const [publicConsumedValue, setPublicConsumedValue] =
    useState<ConsumeShareLinkResponse | null>(null);

  const loadMetadataMutation = useMutation({
    mutationFn: (token: string) =>
      queryClient.fetchQuery({
        queryKey: ["public-share-metadata", token],
        queryFn: () => fetchPublicShareMetadata(token),
        staleTime: 30_000,
      }),
  });

  const consumeShareMutation = useMutation({
    mutationFn: (token: string) => consumePublicShare(token),
  });

  useEffect(() => {
    const rememberedToken = readLastPublicToken();
    if (rememberedToken) {
      setPublicToken(rememberedToken);
    }
  }, []);

  useEffect(() => {
    if (!publicToken.trim()) {
      return;
    }
    saveLastPublicToken(publicToken.trim());
  }, [publicToken]);

  async function handleLoadPublicMetadata(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!publicToken.trim()) {
      setMessage("Enter a share token first.");
      showToast({
        title: "Token required",
        description: "Paste a share token before loading public metadata.",
        tone: "warning",
      });
      return;
    }

    setActionBusy("load-public-share");
    setMessage("Loading public share metadata");

    try {
      const metadata = await loadMetadataMutation.mutateAsync(publicToken.trim());
      saveLastPublicToken(publicToken.trim());
      setPublicMetadata(metadata);
      setPublicConsumedValue(null);
      setMessage(`Loaded public metadata for ${metadata.secretName}.`);
      showToast({
        title: "Public metadata loaded",
        description: `${metadata.secretName} contract metadata is available.`,
        tone: "success",
      });
    } catch (error) {
      handleSessionError(error, "Could not load metadata");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleConsumePublicShare() {
    if (!publicToken.trim()) {
      setMessage("Enter a share token first.");
      showToast({
        title: "Token required",
        description: "Paste a share token before consuming the link.",
        tone: "warning",
      });
      return;
    }

    setActionBusy("consume-public-share");
    setMessage("Consuming public share link");

    try {
      const result = await consumeShareMutation.mutateAsync(publicToken.trim());
      saveLastPublicToken(publicToken.trim());
      setPublicConsumedValue(result);
      setMessage(`Secret ${result.secretKey} consumed successfully.`);
      showToast({
        title: "Share consumed",
        description: `${result.secretKey} was revealed through the public contract flow.`,
        tone: "success",
      });
    } catch (error) {
      handleSessionError(error, "Could not consume share link");
    } finally {
      setActionBusy(null);
    }
  }

  return {
    handleConsumePublicShare,
    handleLoadPublicMetadata,
    publicConsumedValue,
    publicMetadata,
    publicToken,
    setPublicToken,
  };
}
