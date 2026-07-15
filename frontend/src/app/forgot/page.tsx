"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { KeyRound, Mail, ShieldCheck } from "lucide-react";
import { GuestRoute } from "@/components/auth/auth-guards";
import { forgotPasswordRequest } from "@/features/auth/api/auth.api";
import {
  AuthFormHeader,
  AuthShell,
  AuthTrustList,
  PrimaryButton,
} from "@/components/site-chrome";
import { TextField } from "@/components/ui/form-fields";
import { InlineMessage } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast-provider";

export default function ForgotPasswordPage() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await forgotPasswordRequest(email);
      setSent(true);
      showToast({
        title: "Check your email",
        description: "If that email is registered, a reset link is on its way.",
        tone: "success",
      });
    } catch (error) {
      const text = error instanceof Error ? error.message : "Something went wrong";
      showToast({ title: "Couldn't send reset", description: text, tone: "error" });
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
              { icon: ShieldCheck, text: "Reset links expire and can be used once." },
              { icon: KeyRound, text: "Setting a new password signs out your other sessions." },
              { icon: Mail, text: "We never reveal whether an email is registered." },
            ]}
          />
        }
        description="We'll email you a secure link to set a new password."
        eyebrow="Password help"
        title="Reset your password"
      >
        {sent ? (
          <InlineMessage
            body="If that email is registered, we've sent a reset link. Open it to choose a new password."
            title="Check your email"
            tone="success"
          />
        ) : (
          <form className="space-y-5" onSubmit={submit}>
            <AuthFormHeader
              description="Enter your email and we'll send a reset link."
              icon={Mail}
              title="Forgot your password?"
            />
            <TextField label="Email" onChange={setEmail} type="email" value={email} />
            <PrimaryButton busy={busy}>
              {busy ? "Sending…" : "Send reset link"}
            </PrimaryButton>
          </form>
        )}

        <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted">
          <Link className="font-medium text-(--color-brand-strong)" href="/login">
            Back to login
          </Link>
        </div>
      </AuthShell>
    </GuestRoute>
  );
}
