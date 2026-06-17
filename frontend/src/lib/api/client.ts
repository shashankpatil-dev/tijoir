"use client";

import { ApiError, ApiRequestError } from "@/lib/api/errors";

export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8080";

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
    credentials: options.credentials ?? "include",
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
