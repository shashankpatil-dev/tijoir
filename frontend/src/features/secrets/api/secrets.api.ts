"use client";

import { authenticatedApiRequest } from "@/features/auth/lib/auth-storage";
import type {
  GeneratedSecretResponse,
  RevealSecretResponse,
  SecretDetail,
  SecretSummary,
  SecretType,
} from "@/features/secrets/types/secrets.types";

export async function fetchSecrets(accessToken: string) {
  return authenticatedApiRequest<SecretSummary[]>("/api/secrets", accessToken);
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
    { method: "POST", body: JSON.stringify({ value }) },
  );
}

export async function revokeSecret(secretId: string, accessToken: string) {
  return authenticatedApiRequest<SecretDetail>(
    `/api/secrets/${secretId}/revoke`,
    accessToken,
    { method: "POST" },
  );
}
