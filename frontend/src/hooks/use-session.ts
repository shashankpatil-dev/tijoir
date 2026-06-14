"use client";

import { useEffect, useState } from "react";
import {
  authenticatedApiRequest,
  clearSession,
  readSession,
  saveSession,
  type AuthResponse,
} from "@/lib/auth-client";

export function useProtectedSession() {
  const [session, setSession] = useState<AuthResponse | null>(null);
  const [checking, setChecking] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const stored = readSession();
    if (!stored) {
      setChecking(false);
      setErrorMessage("Login required.");
      return;
    }

    setSession(stored);
    setChecking(false);
  }, []);

  async function refresh() {
    const current = readSession();
    if (!current?.accessToken) {
      clearSession();
      setSession(null);
      setErrorMessage("Login required.");
      return null;
    }

    try {
      const fresh = await authenticatedApiRequest<AuthResponse>(
        "/api/auth/me",
        current.accessToken,
      );
      saveSession(fresh);
      setSession(fresh);
      setErrorMessage("");
      return fresh;
    } catch (error) {
      clearSession();
      setSession(null);
      setErrorMessage(
        error instanceof Error ? error.message : "Session validation failed.",
      );
      return null;
    }
  }

  function removeSession() {
    clearSession();
    setSession(null);
  }

  return {
    session,
    checking,
    errorMessage,
    setSession,
    setErrorMessage,
    refresh,
    removeSession,
  };
}

export function useGuestSession() {
  const [checking, setChecking] = useState(true);
  const [session, setSession] = useState<AuthResponse | null>(null);

  useEffect(() => {
    const stored = readSession();
    setSession(stored);
    setChecking(false);
  }, []);

  return {
    session,
    checking,
  };
}
