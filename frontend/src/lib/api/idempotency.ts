"use client";

export function createIdempotencyKey(): string {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  return `tijoir-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}
