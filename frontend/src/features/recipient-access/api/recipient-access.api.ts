"use client";

import { apiRequest } from "@/lib/api/client";
import type {
  ConsumeShareLinkResponse,
  PublicShareLinkMetadataResponse,
} from "@/features/recipient-access/types/recipient-access.types";

const lastPublicTokenKey = "tijoir.lastPublicToken";

export async function fetchPublicShareMetadata(token: string) {
  return apiRequest<PublicShareLinkMetadataResponse>(
    `/api/public/share-links/${token}`,
  );
}

export async function consumePublicShare(token: string) {
  return apiRequest<ConsumeShareLinkResponse>(
    `/api/public/share-links/${token}/consume`,
    { method: "POST" },
  );
}

export function saveLastPublicToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(lastPublicTokenKey, token);
}

export function readLastPublicToken(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.sessionStorage.getItem(lastPublicTokenKey) || "";
}
