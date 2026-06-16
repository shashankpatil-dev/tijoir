"use client";

import { ApiRequestError } from "@/lib/api/errors";
import { apiRequest } from "@/lib/api/client";
import { refreshRequest } from "@/features/auth/api/auth.api";
import type {
  AuthResponse,
  PendingVerification,
} from "@/features/auth/types/auth.types";

const sessionStorageKey = "tijoir.session";
const pendingVerificationKey = "tijoir.pendingVerification";
const rememberedEmailKey = "tijoir.lastEmail";
const redirectPathKey = "tijoir.redirectPath";
const sessionCookieKey = "tijoir_session";
const rememberedEmailCookieKey = "tijoir_last_email";
const redirectCookieKey = "tijoir_redirect";

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

export function saveRedirectPath(path: string) {
  if (typeof window === "undefined" || !path.startsWith("/")) {
    return;
  }

  window.sessionStorage.setItem(redirectPathKey, path);
  writeCookie(redirectCookieKey, path, 1 / 24);
}

export function consumeRedirectPath(defaultPath = "/dashboard/overview"): string {
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
    const refreshed = await refreshRequest(current.refreshToken);
    saveSession(refreshed);
    return readSession();
  } catch {
    clearSession();
    return null;
  }
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
