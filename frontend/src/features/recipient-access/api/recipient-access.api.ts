"use client";

import { apiRequest } from "@/lib/api/client";
import type {
  ConsumeShareLinkResponse,
  CreatePublicSecretShareResponse,
  PublicSecretShareManagementResponse,
  PublicShareLinkMetadataResponse,
  RevokePublicSecretShareResponse,
} from "@/features/recipient-access/types/recipient-access.types";
import type { SecretType } from "@/features/secrets/types/secrets.types";

const lastPublicTokenKey = "tijoir.lastPublicToken";

export async function fetchPublicShareMetadata(token: string) {
  return apiRequest<PublicShareLinkMetadataResponse>(
    `/api/public/share-links/${token}`,
  );
}

export async function createPublicShare(payload: {
  secretName: string;
  secretKey: string;
  secretType: SecretType;
  value: string;
  senderLabel?: string | null;
  recipientLabel?: string | null;
  expiresAt?: string | null;
}) {
  return apiRequest<CreatePublicSecretShareResponse>(
    "/api/public/share-links/quick",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function revokePublicShare(manageToken: string) {
  return apiRequest<RevokePublicSecretShareResponse>(
    `/api/public/share-links/manage/${manageToken}/revoke`,
    { method: "POST" },
  );
}

export async function fetchPublicShareManagement(manageToken: string) {
  return apiRequest<PublicSecretShareManagementResponse>(
    `/api/public/share-links/manage/${manageToken}`,
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
