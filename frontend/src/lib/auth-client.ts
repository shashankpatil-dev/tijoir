"use client";

export type ApiError = {
  message?: string;
  details?: string[];
};

export class ApiRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

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
  refreshToken?: string | null;
  tokenType: string;
  expiresAt: string;
  refreshExpiresAt?: string | null;
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

export type WorkspaceCache = {
  secrets: SecretSummary[];
  shareLinks: ShareLinkResponse[];
  selectedSecretId?: string;
  activeView?: string;
  updatedAt: string;
};

export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8080";

const sessionStorageKey = "tijoir.session";
const pendingVerificationKey = "tijoir.pendingVerification";
const rememberedEmailKey = "tijoir.lastEmail";
const lastPublicTokenKey = "tijoir.lastPublicToken";
const redirectPathKey = "tijoir.redirectPath";
const sessionCookieKey = "tijoir_session";
const rememberedEmailCookieKey = "tijoir_last_email";
const redirectCookieKey = "tijoir_redirect";
const workspaceCachePrefix = "tijoir.workspaceCache.";

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
    cache: options.cache ?? "no-store",
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = body as ApiError;
    throw new ApiRequestError(
      response.status,
      error.message || `Request failed with ${response.status}`,
    );
  }

  return body as T;
}

export async function authenticatedApiRequest<T>(
  path: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    return await apiRequest<T>(path, {
      ...options,
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    if (!(error instanceof ApiRequestError) || error.status !== 401) {
      throw error;
    }

    const refreshed = await refreshSession();
    if (!refreshed?.accessToken) {
      throw error;
    }

    return apiRequest<T>(path, {
      ...options,
      headers: {
        Authorization: `Bearer ${refreshed.accessToken}`,
        ...(options.headers || {}),
      },
    });
  }
}

export function readSession(): AuthResponse | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw =
    window.localStorage.getItem(sessionStorageKey) ||
    readCookie(sessionCookieKey);
  if (!raw) {
    return null;
  }

  try {
    const session = JSON.parse(raw) as AuthResponse;
    if (
      new Date(session.expiresAt).getTime() <= Date.now() &&
      !hasUsableRefreshToken(session)
    ) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function saveSession(session: AuthResponse) {
  if (typeof window === "undefined") {
    return;
  }

  const existing = readStoredSession();
  const merged: AuthResponse = {
    ...session,
    refreshToken: session.refreshToken ?? existing?.refreshToken ?? null,
    refreshExpiresAt:
      session.refreshExpiresAt ?? existing?.refreshExpiresAt ?? null,
  };
  const payload = JSON.stringify(merged);
  window.localStorage.setItem(sessionStorageKey, payload);
  window.localStorage.setItem(rememberedEmailKey, merged.user.email);
  writeCookie(
    sessionCookieKey,
    payload,
    toCookieExpiry(merged.refreshExpiresAt || merged.expiresAt),
  );
  writeCookie(rememberedEmailCookieKey, merged.user.email, 30);
}

export function clearSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(sessionStorageKey);
  clearCookie(sessionCookieKey);
}

export function readRememberedEmail(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return (
    window.localStorage.getItem(rememberedEmailKey) ||
    readCookie(rememberedEmailCookieKey) ||
    ""
  );
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
  writeCookie(rememberedEmailCookieKey, payload.email, 30);
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

export function saveWorkspaceCache(
  organizationSlug: string,
  cache: WorkspaceCache,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    workspaceCachePrefix + organizationSlug,
    JSON.stringify(cache),
  );
}

export function readWorkspaceCache(
  organizationSlug: string,
): WorkspaceCache | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(workspaceCachePrefix + organizationSlug);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as WorkspaceCache;
  } catch {
    window.localStorage.removeItem(workspaceCachePrefix + organizationSlug);
    return null;
  }
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

export function saveRedirectPath(path: string) {
  if (typeof window === "undefined" || !path.startsWith("/")) {
    return;
  }

  window.sessionStorage.setItem(redirectPathKey, path);
  writeCookie(redirectCookieKey, path, 1 / 24);
}

export function consumeRedirectPath(defaultPath = "/dashboard"): string {
  if (typeof window === "undefined") {
    return defaultPath;
  }

  const path =
    window.sessionStorage.getItem(redirectPathKey) ||
    readCookie(redirectCookieKey) ||
    defaultPath;

  window.sessionStorage.removeItem(redirectPathKey);
  clearCookie(redirectCookieKey);
  return path.startsWith("/") ? path : defaultPath;
}

export async function refreshSession(): Promise<AuthResponse | null> {
  const current = readStoredSession();
  if (!current?.refreshToken || !hasUsableRefreshToken(current)) {
    clearSession();
    return null;
  }

  try {
    const refreshed = await apiRequest<AuthResponse>("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({
        refreshToken: current.refreshToken,
      }),
    });
    saveSession(refreshed);
    return readSession();
  } catch {
    clearSession();
    return null;
  }
}

export function buildStaticAppUrl(path: string, params?: Record<string, string>): string {
  const pathname = path === "/" ? "/" : `${path}.html`;
  if (typeof window === "undefined") {
    return pathname;
  }

  const url = new URL(pathname, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return url.toString();
}

function hasUsableRefreshToken(session: AuthResponse): boolean {
  if (!session.refreshToken || !session.refreshExpiresAt) {
    return false;
  }

  return new Date(session.refreshExpiresAt).getTime() > Date.now();
}

function readStoredSession(): AuthResponse | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw =
    window.localStorage.getItem(sessionStorageKey) ||
    readCookie(sessionCookieKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthResponse;
  } catch {
    return null;
  }
}

function writeCookie(name: string, value: string, expiresDays: number) {
  if (typeof document === "undefined") {
    return;
  }

  const expiry = new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expiry.toUTCString()}; path=/; SameSite=Lax`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

function readCookie(name: string): string {
  if (typeof document === "undefined") {
    return "";
  }

  const prefix = `${name}=`;
  const part = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(prefix));
  return part ? decodeURIComponent(part.substring(prefix.length)) : "";
}

function toCookieExpiry(isoInstant: string): number {
  return Math.max(
    (new Date(isoInstant).getTime() - Date.now()) / (24 * 60 * 60 * 1000),
    1 / 24,
  );
}
