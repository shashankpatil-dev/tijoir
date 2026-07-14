"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Building2, KeyRound, ShieldCheck, Timer } from "lucide-react";
import { GuestRoute } from "@/components/auth/auth-guards";
import {
  apiRequest,
  type RegisterResponse,
  savePendingVerification,
} from "@/lib/auth-client";
import {
  AuthFormHeader,
  AuthShell,
  AuthTrustList,
  PrimaryButton,
} from "@/components/site-chrome";
import { PasswordField, TextField } from "@/components/ui/form-fields";
import { useToast } from "@/components/ui/toast-provider";

export default function SignupPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [organizationName, setOrganizationName] = useState("");
  const [organizationEmail, setOrganizationEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);

    try {
      const result = await apiRequest<RegisterResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          organizationName,
          organizationEmail,
          userName,
          userEmail,
          password,
        }),
      });

      savePendingVerification({
        token: result.emailVerificationToken,
        email: userEmail,
        expiresAt: result.emailVerificationExpiresAt,
      });

      showToast({
        title: "Organization created",
        description: result.emailVerificationToken
          ? "Now verify your email to finish setup."
          : "Check your inbox for the verification link.",
        tone: "success",
      });
      router.push("/verify");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Something went wrong";
      showToast({ title: "Couldn't sign up", description: text, tone: "error" });
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
              { icon: Building2, text: "The first account owns the org — its vault, team, and vendor access." },
              { icon: KeyRound, text: "Store and generate every kind of secret in one encrypted vault." },
              { icon: ShieldCheck, text: "Encrypted at rest, audited on every reveal, revocable anytime." },
              { icon: Timer, text: "Up and running in minutes — no credit card." },
            ]}
          />
        }
        description="Create your organization and its first owner account."
        eyebrow="Get started free"
        title="Set up your secure workspace"
      >
        <form className="space-y-5" onSubmit={register}>
          <AuthFormHeader
            description="This sets up the organization and you as its owner."
            icon={Building2}
            title="Create your organization"
          />

          <div className="space-y-4">
            <TextField
              hint="Shown across your workspace."
              label="Organization name"
              onChange={setOrganizationName}
              value={organizationName}
            />
            <TextField
              hint="A shared inbox for the organization works well."
              label="Organization email"
              onChange={setOrganizationEmail}
              type="email"
              value={organizationEmail}
            />
            <TextField label="Your name" onChange={setUserName} value={userName} />
            <TextField
              hint="You'll sign in and verify with this address."
              label="Your email"
              onChange={setUserEmail}
              type="email"
              value={userEmail}
            />
            <PasswordField
              hint="At least 10 characters. Mix it up."
              label="Password"
              onChange={setPassword}
              value={password}
            />
          </div>

          <PrimaryButton busy={busy}>
            {busy ? "Creating…" : "Create organization"}
          </PrimaryButton>
        </form>

        <div className="mt-6">
          <p className="text-sm text-muted">
            Already have an account?{" "}
            <Link className="font-medium text-(--color-brand-strong)" href="/login">
              Log in
            </Link>
          </p>
        </div>
      </AuthShell>
    </GuestRoute>
  );
}
