"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { GuestRoute } from "@/components/auth/auth-guards";
import {
  apiRequest,
  type RegisterResponse,
  savePendingVerification,
} from "@/lib/auth-client";
import {
  AuthShell,
  PrimaryButton,
  StatusPanel,
} from "@/components/site-chrome";
import { PasswordField, TextField } from "@/components/ui/form-fields";
import { BusyOverlay } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast-provider";

export default function SignupPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [organizationName, setOrganizationName] = useState("");
  const [organizationEmail, setOrganizationEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [password, setPassword] = useState("");
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

      savePendingVerification({
        token: result.emailVerificationToken,
        email: userEmail,
        expiresAt: result.emailVerificationExpiresAt,
      });

      setMessage("Registration complete. Check email to verify the owner account.");
      showToast({
        title: "Signup complete",
        description: result.emailVerificationToken
          ? "Organization owner created. Continue to verification."
          : "Organization owner created. Check the inbox for the verification link.",
        tone: "success",
      });
      router.push("/verify");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unexpected error";
      setMessage(text);
      showToast({
        title: "Signup failed",
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
              title="Why this flow exists"
              body="The first user becomes ORG_OWNER. That role anchors vault ownership, future invites, RBAC, and contract-scoped sharing."
            />
            <StatusPanel
              title="Production constraint"
              body="A 409 response here means the organization email or owner email already exists. Use a fresh pair or move to verification for an existing unverified owner."
            />
          </div>
        }
        description="Create the organization and first owner account, then complete verification before the workspace can be used."
        eyebrow="Organization onboarding"
        title="Set up the first secure workspace"
      >
        <BusyOverlay
          body="Provisioning the organization owner and preparing email verification."
          title="Creating organization"
          visible={busy}
        />
        <form className="space-y-4" onSubmit={register}>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-strong)]">
              Signup
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink-strong)]">
              Create the initial owner account
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              This creates the organization identity and its first owner.
            </p>
          </div>

          <TextField
            hint="This is the primary organization name shown in the dashboard."
            label="Organization name"
            onChange={setOrganizationName}
            value={organizationName}
          />
          <TextField
            hint="Must be unique across organizations."
            label="Organization email"
            onChange={setOrganizationEmail}
            type="email"
            value={organizationEmail}
          />
          <TextField label="Owner name" onChange={setUserName} value={userName} />
          <TextField
            hint="Must be unique across users."
            label="Owner email"
            onChange={setUserEmail}
            type="email"
            value={userEmail}
          />
          <PasswordField
            hint="Use at least 10 characters with a strong mix. The backend enforces minimum length."
            label="Password"
            onChange={setPassword}
            value={password}
          />

          <PrimaryButton busy={busy}>Create organization</PrimaryButton>
        </form>

        <div className="mt-6">
          <p className="text-sm text-[var(--color-muted)]">
            Already registered?{" "}
            <Link className="font-medium text-[var(--color-brand-strong)]" href="/login">
              Go to login
            </Link>
          </p>
        </div>
      </AuthShell>
    </GuestRoute>
  );
}
