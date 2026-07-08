"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { GuestRoute } from "@/components/auth/auth-guards";
import { PrimaryButton } from "@/components/site-chrome";
import {
  clearPendingVerification,
  readPendingVerification,
  savePendingVerification,
} from "@/lib/auth-client";
import {
  resendVerificationRequest,
  verifyEmailRequest,
} from "@/features/auth/api/auth.api";
import {
  AuthShell,
  StatusPanel,
} from "@/components/site-chrome";
import { BusyOverlay, InlineMessage } from "@/components/ui/feedback";
import { TextAreaField, TextField } from "@/components/ui/form-fields";
import { useToast } from "@/components/ui/toast-provider";

export default function VerifyPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("Complete email verification to unlock login.");
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
      setMessage("Open the verification link from email or paste the verification token.");
      return;
    }

    setBusy(true);
    setMessage("Verifying token");

    try {
      await verifyEmailRequest(token);

      clearPendingVerification();
      setMessage("Verification complete. Continue to login.");
      showToast({
        title: "Email verified",
        description: "The owner account can now log in.",
        tone: "success",
      });
      router.push("/login");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unexpected error";
      setMessage(text);
      showToast({
        title: "Verification failed",
        description: text,
        tone: "error",
      });
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

      setMessage(
        result.emailVerificationToken
          ? "Fresh verification token issued. Submit it below."
          : "A fresh verification link was sent. Check the inbox and open the link.",
      );
      showToast({
        title: "Verification sent",
        description: result.emailVerificationToken
          ? "Use the new token to complete verification."
          : "Open the fresh verification link from email.",
        tone: "success",
      });
    } catch (error) {
      const text = error instanceof Error ? error.message : "Could not resend token";
      setMessage(text);
      showToast({
        title: "Resend failed",
        description: text,
        tone: "error",
      });
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
              title="Verification delivery"
              body={tokenFromLink
                ? "This verification page was opened from an email link."
                : hasToken
                  ? "A development token is staged in this browser for local or test verification."
                  : "Open the verification link from email. In development you can also paste the token here."}
            />
            <StatusPanel
              title="Owner email"
              body={email ? `Current verification target: ${email}` : "No staged verification email found yet."}
            />
          </div>
        }
        description="Submit the verification token to activate the owner account, then continue into login and the organization dashboard."
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
              Verification must succeed before login and workspace actions become available.
            </p>
          </div>

          <InlineMessage
            body={
              hasToken
                ? "Use the verification action below to activate the owner account."
                : "No staged token is available here. Request a fresh verification email and open the link from the inbox."
            }
            title={hasToken ? "Verification token ready" : "Email link required"}
            tone={hasToken ? "success" : "warning"}
          />

          <TextField
            hint="Used for resend requests and to confirm where the verification email should go."
            label="Owner email"
            onChange={setEmail}
            required
            type="email"
            value={email}
          />

          <TextAreaField
            hint="This is optional in production when you open the email link directly. It remains useful for local and test flows."
            label="Verification token"
            onChange={setToken}
            required={false}
            rows={8}
            value={token}
          />

          <PrimaryButton busy={busy} disabled={!hasToken}>
            Verify email
          </PrimaryButton>
          <button
            className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busy || resendBusy}
            onClick={resendVerification}
            type="button"
          >
            {resendBusy ? "Requesting..." : "Send fresh verification email"}
          </button>
        </form>

        <div className="mt-6 flex flex-wrap gap-4 text-sm text-[var(--color-muted)]">
          <Link className="font-medium text-[var(--color-brand-strong)]" href="/signup">
            Back to signup
          </Link>
          <Link className="font-medium text-[var(--color-brand-strong)]" href="/login">
            Continue to login
          </Link>
        </div>
      </AuthShell>
    </GuestRoute>
  );
}
