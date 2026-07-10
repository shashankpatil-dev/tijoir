"use client";

import { authenticatedApiRequest } from "@/features/auth/lib/auth-storage";
import type { PageResponse } from "@/lib/api/types";
import type {
  ContractPermission,
  ShareLinkResponse,
} from "@/features/share-links/types/share-links.types";

export async function fetchShareLinks(accessToken: string) {
  const page = await fetchShareLinksPage(accessToken, { page: 0, size: 100 });
  return page.items;
}

export async function fetchShareLinksPage(
  accessToken: string,
  params: {
    page?: number;
    size?: number;
    query?: string;
    permission?: ContractPermission;
    status?: string;
  },
) {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.query) searchParams.set("query", params.query);
  if (params.permission) searchParams.set("permission", params.permission);
  if (params.status) searchParams.set("status", params.status);
  return authenticatedApiRequest<PageResponse<ShareLinkResponse>>(
    `/api/share-links?${searchParams.toString()}`,
    accessToken,
  );
}

export async function createShareLink(
  accessToken: string,
  payload: {
    secretId: string;
    recipientLabel?: string | null;
    permission: ContractPermission;
    expiresAt?: string | null;
    vendorId?: string | null;
    contractId?: string | null;
  },
) {
  return authenticatedApiRequest<ShareLinkResponse>(
    "/api/share-links",
    accessToken,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function revokeShareLink(shareLinkId: string, accessToken: string) {
  return authenticatedApiRequest<ShareLinkResponse>(
    `/api/share-links/${shareLinkId}/revoke`,
    accessToken,
    { method: "POST" },
  );
}
