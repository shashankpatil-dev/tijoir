"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { GuestRoute } from "@/components/auth/auth-guards";
import {
  consumeRedirectPath,
  readRememberedEmail,
  saveSession,
} from "@/lib/auth-client";
import { loginRequest } from "@/features/auth/api/auth.api";
import { AuthShell, PrimaryButton, StatusPanel } from "@/components/site-chrome";
import { PasswordField, TextField } from "@/components/ui/form-fields";
import { useToast } from "@/components/ui/toast-provider";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    try {
      const result = await loginRequest(email, password);
      saveSession(result);
      const targetPath = consumeRedirectPath("/dashboard/overview");
      showToast({
        title: "Welcome back",
        description: "Taking you to your workspace.",
        tone: "success",
      });
      router.push(targetPath);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Something went wrong";
      showToast({ title: "Couldn't sign in", description: text, tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <GuestRoute>
      <AuthShell
        aside={
          <div className="space-y-4">
            <StatusPanel
              title="Your session stays with you"
              body="Stay signed in across reloads — we quietly refresh your session in the background."
            />
            <StatusPanel
              title="New here?"
              body="Create an organization, verify your email, and you're in."
            />
          </div>
        }
        description="Sign in to your organization workspace."
        eyebrow="Workspace access"
        title="Welcome back to Tijoir"
      >
        <form className="space-y-4" onSubmit={login}>
          <div>
            <h2 className="text-2xl font-semibold text-(--color-ink-strong)">
              Sign in
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Use your verified email for this organization.
            </p>
          </div>

          <TextField
            label="Email"
            onChange={setEmail}
            type="email"
            value={email}
          />
          <PasswordField
            hint="Hidden by default — use Show only when you need it."
            label="Password"
            onChange={setPassword}
            value={password}
          />

          <PrimaryButton busy={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </PrimaryButton>
        </form>

        <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted">
          <Link className="font-medium text-(--color-brand-strong)" href="/signup">
            Create an account
          </Link>
          <Link className="font-medium text-(--color-brand-strong)" href="/verify">
            Verify your email
          </Link>
        </div>
      </AuthShell>
    </GuestRoute>
  );
}
