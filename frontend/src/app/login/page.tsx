"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  apiRequest,
  readRememberedEmail,
  saveSession,
  type AuthResponse,
} from "@/lib/auth-client";
import {
  AuthShell,
  FormField,
  PrimaryButton,
  StatusPanel,
} from "@/components/site-chrome";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("owner@acme.test");
  const [password, setPassword] = useState("StrongPass@123");
  const [message, setMessage] = useState("Login after email verification.");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const remembered = readRememberedEmail();
    if (remembered) {
      setEmail(remembered);
    }
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("Signing in");

    try {
      const result = await apiRequest<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      saveSession(result);
      setMessage("Login complete. Redirecting to dashboard.");
      router.push("/dashboard");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      aside={
        <div className="space-y-4">
          <StatusPanel
            title="Session persistence"
            body="The frontend now stores the authenticated session locally so a refresh does not throw the user out of the dashboard immediately."
          />
          <StatusPanel
            title="Dashboard access"
            body="After login, the workspace shell can refresh `/api/auth/me` and use the stored bearer token."
          />
        </div>
      }
      description="Authenticate into the workspace after verification and move into the SaaS-style dashboard shell."
      eyebrow="Workspace access"
      title="Sign in to the secure workspace"
    >
      <form className="space-y-4" onSubmit={login}>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-strong)]">
            Login
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink-strong)]">
            Continue into the dashboard
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Use the verified owner account to enter the workspace.
          </p>
        </div>

        <FormField label="Email" onChange={setEmail} type="email" value={email} />
        <FormField label="Password" onChange={setPassword} type="password" value={password} />

        <PrimaryButton busy={busy}>Sign in</PrimaryButton>
      </form>

      <div className="mt-6 space-y-4">
        <StatusPanel body={message} title="System response" />
        <div className="flex flex-wrap gap-4 text-sm text-[var(--color-muted)]">
          <Link className="font-medium text-[var(--color-brand-strong)]" href="/signup">
            Create account
          </Link>
          <Link className="font-medium text-[var(--color-brand-strong)]" href="/verify">
            Verify token
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
