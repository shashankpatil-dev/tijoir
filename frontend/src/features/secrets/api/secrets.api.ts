"use client";

import { authenticatedApiRequest } from "@/features/auth/lib/auth-storage";
import type { PageResponse } from "@/lib/api/types";
import type {
  GeneratedSecretResponse,
  RevealSecretResponse,
  SecretDetail,
  SecretSummary,
  SecretType,
} from "@/features/secrets/types/secrets.types";

export async function fetchSecrets(accessToken: string) {
  const page = await fetchSecretsPage(accessToken, { page: 0, size: 100 });
  return page.items;
}

export async function fetchSecretsPage(
  accessToken: string,
  params: {
    page?: number;
    size?: number;
    query?: string;
    type?: SecretType;
    status?: string;
  },
) {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.query) searchParams.set("query", params.query);
  if (params.type) searchParams.set("type", params.type);
  if (params.status) searchParams.set("status", params.status);
  return authenticatedApiRequest<PageResponse<SecretSummary>>(
    `/api/secrets?${searchParams.toString()}`,
    accessToken,
  );
}

export async function fetchSecretDetail(secretId: string, accessToken: string) {
  return authenticatedApiRequest<SecretDetail>(
    `/api/secrets/${secretId}`,
    accessToken,
  );
}

export async function createSecret(
  accessToken: string,
  payload: {
    name: string;
    type: SecretType;
    description?: string | null;
    value: string;
  },
) {
  return authenticatedApiRequest<SecretDetail>("/api/secrets", accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function generateSecretValue(
  accessToken: string,
  payload: { type: SecretType; length: number },
) {
  return authenticatedApiRequest<GeneratedSecretResponse>(
    "/api/secrets/generate",
    accessToken,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export async function revealSecret(secretId: string, accessToken: string) {
  return authenticatedApiRequest<RevealSecretResponse>(
    `/api/secrets/${secretId}/reveal`,
    accessToken,
    { method: "POST" },
  );
}

export async function rotateSecret(
  secretId: string,
  accessToken: string,
  value: string,
) {
  return authenticatedApiRequest<SecretDetail>(
    `/api/secrets/${secretId}/rotate`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({ value }),
    },
  );
}

export async function revokeSecret(secretId: string, accessToken: string) {
  return authenticatedApiRequest<SecretDetail>(
    `/api/secrets/${secretId}/revoke`,
    accessToken,
    { method: "POST" },
  );
}
