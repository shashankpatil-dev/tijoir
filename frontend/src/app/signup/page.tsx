"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { ArrowLeft, Building2, Check, KeyRound, ShieldCheck, Timer, User } from "lucide-react";
import { GuestRoute } from "@/components/auth/auth-guards";
import {
  apiRequest,
  type RegisterResponse,
  savePendingVerification,
  saveSession,
} from "@/lib/auth-client";
import {
  googleExchangeRequest,
  googleRegisterRequest,
} from "@/features/auth/api/auth.api";
import { GoogleButton } from "@/features/auth/components/google-button";
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
  const [googleIdToken, setGoogleIdToken] = useState<string | null>(null);
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

  async function handleGoogle(idToken: string) {
    setBusy(true);
    try {
      const result = await googleExchangeRequest(idToken);
      if (!result.needsOrganization && result.session) {
        saveSession(result.session);
        showToast({
          title: "Welcome back",
          description: "You already have an account — signing you in.",
          tone: "success",
        });
        router.push("/dashboard/overview");
        return;
      }
      // New Google user: keep the token and collect an organization name.
      setGoogleIdToken(idToken);
      setStep(2);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Google sign-in failed";
      showToast({ title: "Couldn't continue with Google", description: text, tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      if (googleIdToken) {
        const session = await googleRegisterRequest(googleIdToken, organizationName);
        saveSession(session);
        showToast({
          title: "Organization created",
          description: "Welcome to Tijoir.",
          tone: "success",
        });
        router.push("/dashboard/overview");
        return;
      }
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
        {/* Stepper */}
        <div className="mb-6 flex items-center gap-3">
          {[
            { n: 1, label: "Your account" },
            { n: 2, label: "Organization" },
          ].map((entry, index) => (
            <div className="flex flex-1 items-center gap-3" key={entry.n}>
              <div className="flex items-center gap-2">
                <span
                  className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold transition ${
                    step >= entry.n
                      ? "bg-(--color-brand) text-white"
                      : "bg-(--color-surface) text-muted"
                  }`}
                >
                  {step > entry.n ? <Check className="size-3.5" /> : entry.n}
                </span>
                <span
                  className={`text-xs font-medium ${
                    step === entry.n ? "text-(--color-ink-strong)" : "text-muted"
                  }`}
                >
                  {entry.label}
                </span>
              </div>
              {index === 0 ? (
                <span className="h-0.5 flex-1 overflow-hidden rounded bg-border">
                  <span
                    className={`block h-full bg-(--color-brand) transition-all duration-300 ${
                      step === 2 ? "w-full" : "w-0"
                    }`}
                  />
                </span>
              ) : null}
            </div>
          ))}
        </div>

        {step === 1 ? (
          <div className="animate-in fade-in slide-in-from-right-6 duration-300" key="step1">
            <div className="mb-5">
              <GoogleButton onToken={handleGoogle} text="signup_with" />
            </div>
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
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-6 duration-300" key="step2">
            <form className="space-y-5" onSubmit={register}>
              <AuthFormHeader
                description="One last step — name the organization you're creating."
                icon={Building2}
                title="Name your organization"
              />
              <p className="rounded-xl border border-[var(--color-border)] bg-(--color-surface) px-3.5 py-2.5 text-sm text-muted">
                {googleIdToken
                  ? "Finishing setup with your Google account."
                  : userEmail
                    ? <>Owner account: <span className="font-medium text-(--color-ink-strong)">{userEmail}</span></>
                    : "Owner account ready."}
              </p>
              <TextField
                hint="Shown across your workspace. You can change it later."
                label="Organization name"
                onChange={setOrganizationName}
                value={organizationName}
              />
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setStep(1);
                    setGoogleIdToken(null);
                  }}
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
          </div>
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
