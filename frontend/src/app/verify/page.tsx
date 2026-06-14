"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { GuestRoute } from "@/components/auth/auth-guards";
import {
  apiRequest,
  clearPendingVerification,
  readPendingVerification,
} from "@/lib/auth-client";
import {
  AuthShell,
  StatusPanel,
} from "@/components/site-chrome";
import { PrimaryButton } from "@/components/site-chrome";
import { BusyOverlay, InlineMessage } from "@/components/ui/feedback";

export default function VerifyPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("Complete email verification to unlock login.");
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);

  useEffect(() => {
    const pending = readPendingVerification();
    if (!pending) {
      return;
    }

    setToken(pending.token);
    setEmail(pending.email);
  }, []);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("Verifying token");

    try {
      await apiRequest("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token }),
      });

      clearPendingVerification();
      setMessage("Verification complete. Continue to login.");
      router.push("/login");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  }

  async function resendVerification() {
    if (!email.trim()) {
      setMessage("Owner email is required to resend the verification token.");
      return;
    }

    setResendBusy(true);
    setMessage("Requesting a fresh verification token");

    try {
      const result = await apiRequest<{
        emailVerificationToken?: string;
        emailVerificationExpiresAt?: string;
      }>("/api/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      if (result.emailVerificationToken) {
        setToken(result.emailVerificationToken);
      }

      setMessage("Fresh verification token issued. Submit it below.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not resend token");
    } finally {
      setResendBusy(false);
    }
  }

  const tone = message.toLowerCase().includes("complete")
    ? "success"
    : message.toLowerCase().includes("expired") ||
        message.toLowerCase().includes("invalid") ||
        message.toLowerCase().includes("error")
      ? "error"
      : "neutral";

  return (
    <GuestRoute>
      <AuthShell
        aside={
          <div className="space-y-4">
            <StatusPanel
              title="MVP token delivery"
              body="SES is not wired yet, so the verification token is returned by the backend and staged into session storage for this flow."
            />
            <StatusPanel
              title="Owner email"
              body={email ? `Current verification target: ${email}` : "No staged verification email found yet."}
            />
          </div>
        }
        description="Use the token returned by signup to activate the owner account, then continue to login."
        eyebrow="Email verification"
        title="Verify the first owner account"
      >
        <BusyOverlay
          body="Submitting the token and checking whether the owner account can be activated."
          title="Verifying email"
          visible={busy}
        />
        <form className="space-y-4" onSubmit={verify}>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-strong)]">
              Verify
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink-strong)]">
              Confirm the registration token
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              Verification must succeed before the account can log in.
            </p>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-[var(--color-ink)]">
              Verification token
            </span>
            <textarea
              className="mt-2 min-h-44 w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[var(--color-brand-ring)]"
              onChange={(event) => setToken(event.target.value)}
              required
              value={token}
            />
          </label>

          <PrimaryButton busy={busy}>Verify email</PrimaryButton>
          <button
            className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busy || resendBusy}
            onClick={resendVerification}
            type="button"
          >
            {resendBusy ? "Requesting..." : "Resend verification token"}
          </button>
        </form>

        <div className="mt-6 space-y-4">
          <InlineMessage body={message} title="System response" tone={tone} />
          <div className="flex flex-wrap gap-4 text-sm text-[var(--color-muted)]">
            <Link className="font-medium text-[var(--color-brand-strong)]" href="/signup">
              Back to signup
            </Link>
            <Link className="font-medium text-[var(--color-brand-strong)]" href="/login">
              Continue to login
            </Link>
          </div>
        </div>
      </AuthShell>
    </GuestRoute>
  );
}
