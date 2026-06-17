import type { FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { buildStaticAppUrl } from "@/lib/auth-client";
import type {
  RouterLike,
  SharePreview,
  ShowToast,
} from "@/features/dashboard/hooks/workspace.types";
import {
  createShareLink,
  revokeShareLink,
} from "@/features/share-links/api/share-links.api";
import { invalidateShareLinksQueries } from "@/features/share-links/hooks/share-link-query-utils";
import type {
  ContractPermission,
  ShareLinkResponse,
} from "@/features/share-links/types/share-links.types";

type ShareLinkFormStateLike = {
  setCreateShareOpen: (value: boolean) => void;
  shareContractId: string;
  shareExpiry: string;
  sharePermission: ContractPermission;
  shareRecipientLabel: string;
  shareSecretId: string;
  shareVendorId: string;
};

export function useShareLinkActions({
  formState,
  handleSessionError,
  onCreateSuccess,
  page,
  permissionFilter,
  query,
  router,
  sessionAccessToken,
  setActionBusy,
  setMessage,
  setPublicToken,
  showToast,
  statusFilter,
}: {
  formState: ShareLinkFormStateLike;
  handleSessionError: (error: unknown, fallback: string) => void;
  onCreateSuccess: (created: ShareLinkResponse, preview: SharePreview | null) => void;
  page: number;
  permissionFilter: string;
  query: string;
  router: RouterLike;
  sessionAccessToken?: string;
  setActionBusy: (value: string | null) => void;
  setMessage: (value: string) => void;
  setPublicToken: (value: string) => void;
  showToast: ShowToast;
  statusFilter: string;
}) {
  const queryClient = useQueryClient();

  const createShareLinkMutation = useMutation({
    mutationFn: (payload: {
      secretId: string;
      recipientLabel: string | null;
      permission: ContractPermission;
      expiresAt: string | null;
      vendorId?: string | null;
      contractId?: string | null;
    }) => createShareLink(sessionAccessToken as string, payload),
  });

  const revokeShareLinkMutation = useMutation({
    mutationFn: (shareLinkId: string) => revokeShareLink(shareLinkId, sessionAccessToken as string),
  });

  async function handleCreateShareLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionAccessToken) {
      router.replace("/login");
      return;
    }
    if (!formState.shareSecretId) {
      setMessage("Select a secret before creating a share link.");
      return;
    }

    setActionBusy("create-share-link");
    setMessage("Creating share link");

    try {
      const created = await createShareLinkMutation.mutateAsync({
        secretId: formState.shareSecretId,
        recipientLabel: formState.shareRecipientLabel || null,
        permission: formState.sharePermission,
        expiresAt: formState.shareExpiry ? new Date(formState.shareExpiry).toISOString() : null,
        vendorId: formState.shareVendorId || null,
        contractId: formState.shareContractId || null,
      });

      const preview =
        created.shareToken && typeof window !== "undefined"
          ? {
              token: created.shareToken,
              appUrl: buildStaticAppUrl("/access", { token: created.shareToken }),
            }
          : null;

      if (created.shareToken) {
        setPublicToken(created.shareToken);
      }

      formState.setCreateShareOpen(false);
      router.push("/dashboard/share-links");
      await invalidateShareLinksQueries({
        accessToken: sessionAccessToken,
        page,
        permission: permissionFilter,
        query,
        queryClient,
        status: statusFilter,
      });
      onCreateSuccess(created, preview);
      setMessage(`Share link created for ${created.secretKey}.`);
      showToast({
        title: "Share link created",
        description: `${created.secretKey} is ready for recipient testing.`,
        tone: "success",
      });
    } catch (error) {
      handleSessionError(error, "Could not create share link");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleRevokeShareLink(shareLinkId: string) {
    if (!sessionAccessToken) {
      router.replace("/login");
      return;
    }

    setActionBusy(`revoke-share-${shareLinkId}`);
    setMessage("Revoking share link");

    try {
      await revokeShareLinkMutation.mutateAsync(shareLinkId);
      await invalidateShareLinksQueries({
        accessToken: sessionAccessToken,
        page,
        permission: permissionFilter,
        query,
        queryClient,
        status: statusFilter,
      });
      setMessage("Share link revoked.");
      showToast({
        title: "Share link revoked",
        description: "Recipient access for this link has been closed.",
        tone: "warning",
      });
    } catch (error) {
      handleSessionError(error, "Could not revoke share link");
    } finally {
      setActionBusy(null);
    }
  }

  return {
    handleCreateShareLink,
    handleRevokeShareLink,
  };
}
