"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { LoadingScreen } from "@/components/ui/feedback";
import { saveRedirectPath } from "@/lib/auth-client";
import { useGuestSession, useProtectedSession } from "@/hooks/use-session";

export function ProtectedRoute({
  children,
}: {
  children: (sessionState: ReturnType<typeof useProtectedSession>) => ReactNode;
}) {
  const router = useRouter();
  const sessionState = useProtectedSession();

  useEffect(() => {
    if (!sessionState.checking && !sessionState.session) {
      if (typeof window !== "undefined") {
        saveRedirectPath(
          `${window.location.pathname}${window.location.search}${window.location.hash}`,
        );
      }
      router.replace("/login");
    }
  }, [router, sessionState.checking, sessionState.session]);

  if (sessionState.checking) {
    return (
      <LoadingScreen
        body="Restoring the organization session before entering the workspace."
        title="Checking access"
      />
    );
  }

  if (!sessionState.session) {
    return (
      <LoadingScreen
        body={sessionState.errorMessage || "Redirecting to login."}
        title="Authentication required"
      />
    );
  }

  return <>{children(sessionState)}</>;
}

export function GuestRoute({
  children,
}: {
  children: ReactNode | ((targetPath: string) => ReactNode);
}) {
  const router = useRouter();
  const { session, checking } = useGuestSession();
  const [targetPath, setTargetPath] = useState("/dashboard/overview");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setTargetPath(
      window.sessionStorage.getItem("tijoir.redirectPath") ||
        "/dashboard/overview",
    );
  }, []);

  useEffect(() => {
    if (!checking && session) {
      router.replace(targetPath);
    }
  }, [checking, router, session, targetPath]);

  if (checking) {
    return (
      <LoadingScreen
        body="Checking whether a workspace session already exists."
        title="Preparing page"
      />
    );
  }

  if (session) {
    return (
      <LoadingScreen
        body="Redirecting into the organization dashboard."
        title="Session found"
      />
    );
  }

  return <>{typeof children === "function" ? children(targetPath) : children}</>;
}
