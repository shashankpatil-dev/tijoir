"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { ArrowLeft, Building2, KeyRound, ShieldCheck, Timer, User } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { PasswordField, TextField } from "@/components/ui/form-fields";
import { useToast } from "@/components/ui/toast-provider";

export default function SignupPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [busy, setBusy] = useState(false);

  const step1Ready =
    userName.trim().length > 0 && userEmail.trim().length > 0 && password.length >= 10;

  function continueToOrg(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!step1Ready) {
      showToast({
        title: "Complete your details",
        description: "Name, email, and a 10+ character password are required.",
        tone: "warning",
      });
      return;
    }
    setStep(2);
  }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await apiRequest<RegisterResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ organizationName, userName, userEmail, password }),
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
        description="Create your account, then name your organization."
        eyebrow="Get started free"
        title="Set up your secure workspace"
      >
        {/* Step indicator */}
        <div className="mb-5 flex items-center gap-2 text-xs font-medium text-muted">
          <span className={step === 1 ? "text-(--color-brand-strong)" : ""}>1. Your account</span>
          <span className="h-px w-6 bg-border" />
          <span className={step === 2 ? "text-(--color-brand-strong)" : ""}>2. Organization</span>
        </div>

        {step === 1 ? (
          <form className="space-y-5" onSubmit={continueToOrg}>
            <AuthFormHeader
              description="This becomes the organization owner account."
              icon={User}
              title="Create your account"
            />
            <div className="space-y-4">
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
            <PrimaryButton disabled={!step1Ready}>Continue</PrimaryButton>
          </form>
        ) : (
          <form className="space-y-5" onSubmit={register}>
            <AuthFormHeader
              description="One last step — name the organization you're creating."
              icon={Building2}
              title="Name your organization"
            />
            <TextField
              hint="Shown across your workspace. You can change it later."
              label="Organization name"
              onChange={setOrganizationName}
              value={organizationName}
            />
            <div className="flex gap-3">
              <Button
                onClick={() => setStep(1)}
                type="button"
                variant="outline"
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <PrimaryButton busy={busy} disabled={organizationName.trim().length === 0}>
                {busy ? "Creating…" : "Create organization"}
              </PrimaryButton>
            </div>
          </form>
        )}

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
