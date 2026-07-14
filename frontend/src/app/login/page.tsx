"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { GuestRoute } from "@/components/auth/auth-guards";
import {
  consumeRedirectPath,
  readRememberedEmail,
  saveSession,
} from "@/lib/auth-client";
import { loginRequest } from "@/features/auth/api/auth.api";
import {
  AuthShell,
  PrimaryButton,
  StatusPanel,
} from "@/components/site-chrome";
import { PasswordField, TextField } from "@/components/ui/form-fields";
import { BusyOverlay } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast-provider";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const result = await loginRequest(email, password);
      saveSession(result);
      const targetPath = consumeRedirectPath("/dashboard/overview");
      setMessage("Login complete. Redirecting to workspace.");
      showToast({
        title: "Login successful",
        description: "Session restored. Redirecting to the workspace.",
        tone: "success",
      });
      router.push(targetPath);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unexpected error";
      setMessage(text);
      showToast({
        title: "Login failed",
        description: text,
        tone: "error",
      });
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
              title="Session persistence"
              body="A valid session is persisted in browser storage with refresh-token recovery so the workspace survives reloads and short-lived access expiry."
            />
            <StatusPanel
              title="Expected flow"
              body="Signup creates the owner account, verification unlocks access, and login sends the user directly into the organization workspace."
            />
          </div>
        }
        description="Authenticate into the organization workspace after verification and continue into the operational dashboard."
        eyebrow="Workspace access"
        title="Sign in to the secure workspace"
      >
        <BusyOverlay
          body="Validating credentials and restoring the workspace session."
          title="Signing in"
          visible={busy}
        />
        <form className="space-y-4" onSubmit={login}>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-(--color-brand-strong)">
              Login
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-(--color-ink-strong)">
              Continue into the dashboard
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Use the verified account for this organization. After sign-in, the dashboard restores the intended route automatically.
            </p>
          </div>

          <TextField
            hint="Use the verified owner or member email for this organization."
            label="Email"
            onChange={setEmail}
            type="email"
            value={email}
          />
          <PasswordField
            hint="Passwords stay masked by default. Use Show only when needed."
            label="Password"
            onChange={setPassword}
            value={password}
          />

          <PrimaryButton busy={busy}>Sign in</PrimaryButton>
        </form>

        <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted">
          <Link className="font-medium text-(--color-brand-strong)" href="/signup">
            Create account
          </Link>
          <Link className="font-medium text-(--color-brand-strong)" href="/verify">
            Verify token
          </Link>
        </div>
      </AuthShell>
    </GuestRoute>
  );
}
