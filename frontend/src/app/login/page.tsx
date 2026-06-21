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
import { loginRequest, verifyMfaChallengeRequest } from "@/features/auth/api/auth.api";
import {
  AuthShell,
  PrimaryButton,
  StatusPanel,
} from "@/components/site-chrome";
import { PasswordField, TextField } from "@/components/ui/form-fields";
import { BusyOverlay, InlineMessage } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast-provider";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);
  const [mfaChallengeExpiresAt, setMfaChallengeExpiresAt] = useState<string | null>(null);
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
    setMessage(mfaChallengeId ? "Verifying MFA challenge" : "Signing in");

    try {
      if (mfaChallengeId) {
        const verifiedSession = await verifyMfaChallengeRequest(mfaChallengeId, mfaCode);
        saveSession(verifiedSession);
        const targetPath = consumeRedirectPath("/dashboard/overview");
        setMessage("MFA verified. Redirecting to workspace.");
        showToast({
          title: "Login successful",
          description: "Multi-factor verification completed. Redirecting to the workspace.",
          tone: "success",
        });
        router.push(targetPath);
        return;
      }

      const result = await loginRequest(email, password);
      if (result.mfaRequired && result.mfaChallengeId) {
        setMfaChallengeId(result.mfaChallengeId);
        setMfaChallengeExpiresAt(result.mfaChallengeExpiresAt ?? null);
        setMfaCode("");
        setMessage("Enter the 6-digit code from your authenticator app.");
        showToast({
          title: "Additional verification required",
          description: "Enter the current authenticator code to finish login.",
          tone: "warning",
        });
        return;
      }

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
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-strong)]">
              Login
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink-strong)]">
              Continue into the dashboard
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              Use the verified account for this organization. After sign-in, the dashboard restores the intended route automatically.
            </p>
          </div>

          {mfaChallengeId ? (
            <InlineMessage
              body={`The password step is complete. Enter the current authenticator code${mfaChallengeExpiresAt ? ` before ${new Date(mfaChallengeExpiresAt).toLocaleTimeString()}` : ""}.`}
              title="Multi-factor verification"
              tone="warning"
            />
          ) : null}

          <TextField
            hint="Use the verified owner or member email for this organization."
            label="Email"
            onChange={setEmail}
            disabled={Boolean(mfaChallengeId)}
            type="email"
            value={email}
          />
          <PasswordField
            hint="Passwords stay masked by default. Use Show only when needed."
            label="Password"
            onChange={setPassword}
            disabled={Boolean(mfaChallengeId)}
            value={password}
          />
          {mfaChallengeId ? (
            <TextField
              hint="Use the current 6-digit code from your authenticator app."
              label="Authenticator code"
              onChange={setMfaCode}
              value={mfaCode}
            />
          ) : null}

          <PrimaryButton busy={busy}>
            {mfaChallengeId ? "Verify and continue" : "Sign in"}
          </PrimaryButton>
          {mfaChallengeId ? (
            <button
              className="w-full text-sm font-medium text-[var(--color-brand-strong)]"
              onClick={() => {
                setMfaChallengeId(null);
                setMfaChallengeExpiresAt(null);
                setMfaCode("");
                setMessage("Login after email verification.");
              }}
              type="button"
            >
              Start over
            </button>
          ) : null}
        </form>

        <div className="mt-6 flex flex-wrap gap-4 text-sm text-[var(--color-muted)]">
          <Link className="font-medium text-[var(--color-brand-strong)]" href="/signup">
            Create account
          </Link>
          <Link className="font-medium text-[var(--color-brand-strong)]" href="/verify">
            Verify token
          </Link>
        </div>
      </AuthShell>
    </GuestRoute>
  );
}
