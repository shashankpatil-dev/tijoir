"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  apiRequest,
  type RegisterResponse,
  savePendingVerification,
} from "@/lib/auth-client";
import {
  AuthShell,
  FormField,
  PrimaryButton,
  StatusPanel,
} from "@/components/site-chrome";

export default function SignupPage() {
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState("Acme Integrations");
  const [organizationEmail, setOrganizationEmail] = useState("security@acme.test");
  const [userName, setUserName] = useState("Acme Owner");
  const [userEmail, setUserEmail] = useState("owner@acme.test");
  const [password, setPassword] = useState("StrongPass@123");
  const [message, setMessage] = useState("Create your organization owner account.");
  const [busy, setBusy] = useState(false);

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("Creating organization");

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

      if (result.emailVerificationToken) {
        savePendingVerification({
          token: result.emailVerificationToken,
          email: userEmail,
          expiresAt: result.emailVerificationExpiresAt,
        });
      }

      setMessage("Registration complete. Continue to email verification.");
      router.push("/verify");
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
            title="Why this flow exists"
            body="The first user becomes ORG_OWNER, which is the basis for vault ownership, RBAC, and future vendor sharing."
          />
          <StatusPanel
            title="What happens next"
            body="After signup, verify the email token, then log in and enter the workspace dashboard."
          />
        </div>
      }
      description="Start with the first organization owner account, then move into verification and dashboard access."
      eyebrow="Organization onboarding"
      title="Set up the first secure workspace"
    >
      <form className="space-y-4" onSubmit={register}>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-strong)]">
            Signup
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink-strong)]">
            Create the initial owner account
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            This creates the organization and the first `ORG_OWNER`.
          </p>
        </div>

        <FormField label="Organization name" onChange={setOrganizationName} value={organizationName} />
        <FormField label="Organization email" onChange={setOrganizationEmail} type="email" value={organizationEmail} />
        <FormField label="Owner name" onChange={setUserName} value={userName} />
        <FormField label="Owner email" onChange={setUserEmail} type="email" value={userEmail} />
        <FormField label="Password" onChange={setPassword} type="password" value={password} />

        <PrimaryButton busy={busy}>Create organization</PrimaryButton>
      </form>

      <div className="mt-6 space-y-4">
        <StatusPanel body={message} title="System response" />
        <p className="text-sm text-[var(--color-muted)]">
          Already registered?{" "}
          <Link className="font-medium text-[var(--color-brand-strong)]" href="/login">
            Go to login
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
