"use client";

export type ApiError = {
  message?: string;
  details?: string[];
};

export type SecretType =
  | "PASSWORD"
  | "API_KEY"
  | "WEBHOOK_SECRET"
  | "SSH_PUBLIC_KEY"
  | "SSH_PRIVATE_KEY"
  | "SFTP_PASSWORD"
  | "TOKEN"
  | "CERTIFICATE"
  | "CUSTOM";

export type SecretStatus = "ACTIVE" | "REVOKED";
export type ContractPermission =
  | "VIEW_ONCE"
  | "VIEW_UNTIL_REVOKED"
  | "ROTATION_NOTIFY_ONLY";
export type ShareLinkStatus = "ACTIVE" | "REVOKED" | "CONSUMED" | "EXPIRED";

export type AuthResponse = {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  user: {
    name: string;
    email: string;
    role: string;
    emailVerified: boolean;
  };
  organization: {
    name: string;
    slug: string;
    email: string;
  };
};

export type RegisterResponse = {
  emailVerificationToken?: string;
  emailVerificationExpiresAt?: string;
};

export type PendingVerification = {
  token: string;
  email: string;
  expiresAt?: string;
};

export type SecretSummary = {
  id: string;
  name: string;
  secretKey: string;
  type: SecretType;
  status: SecretStatus;
  currentVersionNumber: number;
  createdAt: string;
};

export type SecretDetail = {
  id: string;
  name: string;
  secretKey: string;
  type: SecretType;
  description?: string | null;
  status: SecretStatus;
  currentVersionNumber: number;
  createdByName: string;
  createdByEmail: string;
  createdAt: string;
};

export type RevealSecretResponse = {
  id: string;
  secretKey: string;
  type: SecretType;
  versionNumber: number;
  value: string;
};

export type GeneratedSecretResponse = {
  type: SecretType;
  length: number;
  value: string;
};

export type ShareLinkResponse = {
  id: string;
  secretId: string;
  secretName: string;
  secretKey: string;
  secretType: SecretType;
  recipientLabel?: string | null;
  permission: ContractPermission;
  status: ShareLinkStatus;
  expiresAt?: string | null;
  consumedAt?: string | null;
  createdAt: string;
  shareToken?: string | null;
  publicMetadataPath?: string | null;
  publicConsumePath?: string | null;
};

export type PublicShareLinkMetadataResponse = {
  organizationName: string;
  secretName: string;
  secretType: SecretType;
  recipientLabel?: string | null;
  permission: ContractPermission;
  status: ShareLinkStatus;
  expiresAt?: string | null;
  canReveal: boolean;
};

export type ConsumeShareLinkResponse = {
  shareLinkId: string;
  secretName: string;
  secretKey: string;
  secretType: SecretType;
  versionNumber: number;
  value: string;
  permission: ContractPermission;
  status: ShareLinkStatus;
};

export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8080";

const sessionStorageKey = "tijoir.session";
const pendingVerificationKey = "tijoir.pendingVerification";
const rememberedEmailKey = "tijoir.lastEmail";

export function apiUrl(path: string): string {
  return `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = body as ApiError;
    throw new Error(error.message || `Request failed with ${response.status}`);
  }

  return body as T;
}

export async function authenticatedApiRequest<T>(
  path: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<T> {
  return apiRequest<T>(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {}),
    },
  });
}

export function readSession(): AuthResponse | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(sessionStorageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthResponse;
  } catch {
    window.localStorage.removeItem(sessionStorageKey);
    return null;
  }
}

export function saveSession(session: AuthResponse) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(sessionStorageKey, JSON.stringify(session));
  window.localStorage.setItem(rememberedEmailKey, session.user.email);
}

export function clearSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(sessionStorageKey);
}

export function readRememberedEmail(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(rememberedEmailKey) || "";
}

export function savePendingVerification(payload: PendingVerification) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    pendingVerificationKey,
    JSON.stringify(payload),
  );
  window.localStorage.setItem(rememberedEmailKey, payload.email);
}

export function readPendingVerification(): PendingVerification | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(pendingVerificationKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PendingVerification;
  } catch {
    window.sessionStorage.removeItem(pendingVerificationKey);
    return null;
  }
}

export function clearPendingVerification() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(pendingVerificationKey);
}
