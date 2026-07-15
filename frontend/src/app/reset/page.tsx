"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { KeyRound, Lock, ShieldCheck } from "lucide-react";
import { GuestRoute } from "@/components/auth/auth-guards";
import { resetPasswordRequest } from "@/features/auth/api/auth.api";
import {
  AuthFormHeader,
  AuthShell,
  AuthTrustList,
  PrimaryButton,
} from "@/components/site-chrome";
import { PasswordField, TextAreaField } from "@/components/ui/form-fields";
import { InlineMessage } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast-provider";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [tokenFromLink, setTokenFromLink] = useState(false);

  useEffect(() => {
    const urlToken = new URLSearchParams(window.location.search).get("token")?.trim();
    if (urlToken) {
      setToken(urlToken);
      setTokenFromLink(true);
    }
  }, []);

  const hasToken = token.trim().length > 0;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasToken) {
      showToast({
        title: "Reset link needed",
        description: "Open the reset link from your email.",
        tone: "warning",
      });
      return;
    }
    setBusy(true);
    try {
      await resetPasswordRequest(token, newPassword);
      showToast({
        title: "Password updated",
        description: "Sign in with your new password.",
        tone: "success",
      });
      router.push("/login");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Something went wrong";
      showToast({ title: "Couldn't reset password", description: text, tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <GuestRoute>
      <AuthShell
        aside={
          <AuthTrustList
            items={[
              { icon: ShieldCheck, text: "This link works once and expires soon." },
              { icon: KeyRound, text: "Use at least 10 characters with a strong mix." },
              { icon: Lock, text: "Your other sessions are signed out after reset." },
            ]}
          />
        }
        description="Choose a new password for your account."
        eyebrow="Password help"
        title="Set a new password"
      >
        <form className="space-y-5" onSubmit={submit}>
          <AuthFormHeader
            description="Enter a new password to finish resetting."
            icon={Lock}
            title="New password"
          />

          {!tokenFromLink ? (
            <InlineMessage
              body="Open the reset link from your email. You can also paste the token below."
              title="Reset link required"
              tone="warning"
            />
          ) : null}

          {!tokenFromLink ? (
            <TextAreaField
              hint="From your reset email. Filled automatically when you open the link."
              label="Reset token"
              onChange={setToken}
              required={false}
              rows={3}
              value={token}
            />
          ) : null}

          <PasswordField
            hint="At least 10 characters."
            label="New password"
            onChange={setNewPassword}
            value={newPassword}
          />

          <PrimaryButton busy={busy} disabled={!hasToken}>
            {busy ? "Updating…" : "Update password"}
          </PrimaryButton>
        </form>

        <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted">
          <Link className="font-medium text-(--color-brand-strong)" href="/login">
            Back to login
          </Link>
        </div>
      </AuthShell>
    </GuestRoute>
  );
}
