"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { GuestRoute } from "@/components/auth/auth-guards";
import {
  clearPendingVerification,
  readPendingVerification,
  savePendingVerification,
} from "@/lib/auth-client";
import {
  resendVerificationRequest,
  verifyEmailRequest,
} from "@/features/auth/api/auth.api";
import { AuthShell, PrimaryButton, StatusPanel } from "@/components/site-chrome";
import { InlineMessage } from "@/components/ui/feedback";
import { TextAreaField, TextField } from "@/components/ui/form-fields";
import { useToast } from "@/components/ui/toast-provider";

export default function VerifyPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [tokenFromLink, setTokenFromLink] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token")?.trim() || "";
    const urlEmail = params.get("email")?.trim() || "";
    const pending = readPendingVerification();

    if (urlToken) {
      setToken(urlToken);
      setTokenFromLink(true);
    }
    if (urlEmail) {
      setEmail(urlEmail);
    }
    if (!pending) {
      return;
    }
    if (!urlToken && pending.token) {
      setToken(pending.token);
    }
    if (!urlEmail) {
      setEmail(pending.email);
    }
  }, []);

  const hasToken = token.trim().length > 0;

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasToken) {
      showToast({
        title: "Token needed",
        description: "Open the link from your email, or paste the token here.",
        tone: "warning",
      });
      return;
    }

    setBusy(true);
    try {
      await verifyEmailRequest(token);
      clearPendingVerification();
      showToast({
        title: "Email verified",
        description: "You can log in now.",
        tone: "success",
      });
      router.push("/");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Something went wrong";
      showToast({ title: "Verification failed", description: text, tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function resendVerification() {
    if (!email.trim()) {
      showToast({
        title: "Email needed",
        description: "Enter your email to get a fresh verification link.",
        tone: "warning",
      });
      return;
    }

    setResendBusy(true);
    try {
      const result = await resendVerificationRequest(email);
      savePendingVerification({
        token: result.emailVerificationToken,
        email,
        expiresAt: result.emailVerificationExpiresAt,
      });
      if (result.emailVerificationToken) {
        setToken(result.emailVerificationToken);
        setTokenFromLink(false);
      }
      showToast({
        title: "Verification sent",
        description: result.emailVerificationToken
          ? "A fresh token is ready below."
          : "Open the new link from your inbox.",
        tone: "success",
      });
    } catch (error) {
      const text = error instanceof Error ? error.message : "Couldn't resend";
      showToast({ title: "Resend failed", description: text, tone: "error" });
    } finally {
      setResendBusy(false);
    }
  }

  return (
    <GuestRoute>
      <AuthShell
        aside={
          <div className="space-y-4">
            <StatusPanel
              title="Almost there"
              body="Verifying your email unlocks  and the workspace."
            />
            <StatusPanel
              title="Where's the link?"
              body="Check your inbox. In development the token appears here automatically."
            />
          </div>
        }
        description="Confirm your email to activate the account."
        eyebrow="Email verification"
        title="Verify your email"
      >
        <form className="space-y-4" onSubmit={verify}>
          <div>
            <h2 className="text-2xl font-semibold text-(--color-ink-strong)">
              Confirm your email
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Verification unlocks  and everything in the workspace.
            </p>
          </div>

          <InlineMessage
            body={
              hasToken
                ? "Your token is ready — verify below."
                : "Open the link from your email, or paste your token to continue."
            }
            title={hasToken ? "Ready to verify" : "Waiting for your token"}
            tone={hasToken ? "success" : "warning"}
          />

          <TextField
            label="Email"
            onChange={setEmail}
            required
            type="email"
            value={email}
          />

          <TextAreaField
            hint="You usually don't need this — opening the email link fills it in. Handy for local testing."
            label="Verification token"
            onChange={setToken}
            required={false}
            rows={hasToken ? 6 : 3}
            value={token}
          />

          <PrimaryButton busy={busy} disabled={!hasToken}>
            {busy ? "Verifying…" : "Verify email"}
          </PrimaryButton>
          <button
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-(--color-ink) transition hover:border-(--color-brand) disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busy || resendBusy}
            onClick={resendVerification}
            type="button"
          >
            {resendBusy ? "Sending…" : "Send a fresh verification email"}
          </button>
        </form>

        <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted">
          <Link className="font-medium text-(--color-brand-strong)" href="/signup">
            Back to signup
          </Link>
          <Link className="font-medium text-(--color-brand-strong)" href="/">
            Continue to 
          </Link>
        </div>
      </AuthShell>
    </GuestRoute>
  );
}
