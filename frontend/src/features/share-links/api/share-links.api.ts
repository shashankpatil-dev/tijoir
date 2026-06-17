"use client";

import { authenticatedApiRequest } from "@/features/auth/lib/auth-storage";
import type { PageResponse } from "@/lib/api/types";
import type {
  ContractPermission,
  ShareLinkResponse,
} from "@/features/share-links/types/share-links.types";

export async function fetchShareLinks(accessToken: string) {
  const page = await authenticatedApiRequest<PageResponse<ShareLinkResponse>>(
    "/api/share-links?page=0&size=100",
    accessToken,
  );
  return page.items;
}

export async function createShareLink(
  accessToken: string,
  payload: {
    secretId: string;
    recipientLabel?: string | null;
    permission: ContractPermission;
    expiresAt?: string | null;
  },
) {
  return authenticatedApiRequest<ShareLinkResponse>(
    "/api/share-links",
    accessToken,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export async function revokeShareLink(shareLinkId: string, accessToken: string) {
  return authenticatedApiRequest<ShareLinkResponse>(
    `/api/share-links/${shareLinkId}/revoke`,
    accessToken,
    { method: "POST" },
  );
}
