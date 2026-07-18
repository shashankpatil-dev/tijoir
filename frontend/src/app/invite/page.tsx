"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AuthShell, StatusPanel } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/feedback";
import { PasswordField, TextField } from "@/components/ui/form-fields";
import { useToast } from "@/components/ui/toast-provider";
import {
  clearSession,
  saveRedirectPath,
  saveSession,
} from "@/lib/auth-client";
import {
  acceptInviteRequest,
  resolveInviteRequest,
} from "@/features/auth/api/auth.api";
import type { InviteResolutionResponse } from "@/features/auth/types/auth.types";
import { useGuestSession } from "@/hooks/use-session";

export default function InvitePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { session, checking } = useGuestSession();
  const [token, setToken] = useState("");
  const [resolution, setResolution] = useState<InviteResolutionResponse | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState("");

  const sessionEmail = session?.user.email?.toLowerCase() ?? "";
  const invitedEmail = resolution?.invitedEmail?.toLowerCase() ?? "";
  const emailMatchesActiveSession = Boolean(sessionEmail && invitedEmail && sessionEmail === invitedEmail);
  const requiresLogin = Boolean(resolution?.existingAccount && !session);
  const wrongSessionActive = Boolean(session && invitedEmail && sessionEmail !== invitedEmail);
  const canSelfRegister = Boolean(resolution && !resolution.existingAccount && !session);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setToken(new URLSearchParams(window.location.search).get("token")?.trim() ?? "");
  }, []);

  useEffect(() => {
    if (!token) {
      setLoadingInvite(false);
      setLoadError("Invite token missing.");
      return;
    }

    let cancelled = false;

    async function loadInvite() {
      setLoadingInvite(true);
      setLoadError("");

      try {
        const nextResolution = await resolveInviteRequest(token);
        if (cancelled) {
          return;
        }
        setResolution(nextResolution);
      } catch (error) {
        if (cancelled) {
          return;
        }
        setResolution(null);
        setLoadError(error instanceof Error ? error.message : "Could not load invite.");
      } finally {
        if (!cancelled) {
          setLoadingInvite(false);
        }
      }
    }

    void loadInvite();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const invitePath = useMemo(() => {
    if (typeof window === "undefined") {
      return token ? `/invite?token=${encodeURIComponent(token)}` : "/invite";
    }

    return `${window.location.pathname}${window.location.search}`;
  }, [token]);

  async function acceptInvite(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!token || !resolution) {
      return;
    }

    setBusy(true);
    try {
      const result = await acceptInviteRequest(
        token,
        canSelfRegister ? { name, password } : undefined,
        session?.accessToken ?? undefined,
      );

      saveSession(result);
      showToast({
        title: "Invite accepted",
        description: `Joined ${result.organization.name}. Redirecting to the workspace.`,
        tone: "success",
      });
      router.push("/dashboard/overview");
    } catch (error) {
      showToast({
        title: "Invite acceptance failed",
        description: error instanceof Error ? error.message : "Unexpected error",
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  function redirectToLogin() {
    saveRedirectPath(invitePath);
    router.push("/login");
  }

  function switchAccount() {
    saveRedirectPath(invitePath);
    clearSession();
    router.push("/login");
  }

  if (checking || loadingInvite) {
    return (
      <LoadingScreen
        body="Checking invite state and any active session."
        title="Preparing invite"
      />
    );
  }

  return (
    <AuthShell
      aside={
        <div className="space-y-4">
          <StatusPanel
            title={resolution ? resolution.organizationName : "Invitation"}
            body={
              resolution
                ? `Role: ${resolution.role}. Invite email: ${resolution.invitedEmail}.`
                : "Resolve the invite token first."
            }
          />
          <StatusPanel
            title="How this works"
            body="Existing users sign in with the invited email and join the organization. New users create their password once and continue directly into the workspace."
          />
        </div>
      }
      description="Join an organization workspace from a secure invite."
      eyebrow="Organization invite"
      title="Accept your Tijoir invite"
    >
      {loadError ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-(--color-danger-soft) bg-(--color-surface) px-4 py-4 text-sm text-(--color-ink-strong)">
            {loadError}
          </div>
          <Button onClick={() => router.push("/login")} type="button" variant="outline">
            Back to login
          </Button>
        </div>
      ) : null}

      {!loadError && resolution ? (
        <div className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-(--color-ink-strong)">
              {resolution.organizationName}
            </h2>
            <p className="text-sm leading-6 text-muted">
              This invite grants the <span className="font-medium text-(--color-ink-strong)">{resolution.role}</span> role
              to <span className="font-medium text-(--color-ink-strong)"> {resolution.invitedEmail}</span>.
            </p>
          </div>

          {requiresLogin ? (
            <div className="space-y-4">
              <StatusPanel
                title="Sign in to accept"
                body="This email already has a Tijoir account. Sign in with the invited email, then accept the organization membership."
              />
              <div className="flex justify-end">
                <Button onClick={redirectToLogin} type="button">
                  Sign in to continue
                </Button>
              </div>
            </div>
          ) : null}

          {wrongSessionActive ? (
            <div className="space-y-4">
              <StatusPanel
                title="Wrong account signed in"
                body={`You are signed in as ${session?.user.email}. This invite is for ${resolution.invitedEmail}. Switch accounts to continue.`}
              />
              <div className="flex justify-end">
                <Button onClick={switchAccount} type="button" variant="outline">
                  Sign in with invited email
                </Button>
              </div>
            </div>
          ) : null}

          {emailMatchesActiveSession ? (
            <div className="space-y-4">
              <StatusPanel
                title="Ready to join"
                body={`You are signed in as ${session?.user.email}. Accept to add ${resolution.organizationName} to your workspaces.`}
              />
              <div className="flex justify-end">
                <Button disabled={busy} onClick={() => void acceptInvite()} type="button">
                  {busy ? "Joining..." : "Accept invite"}
                </Button>
              </div>
            </div>
          ) : null}

          {canSelfRegister ? (
            <form className="space-y-4" onSubmit={acceptInvite}>
              <div>
                <h2 className="text-2xl font-semibold text-(--color-ink-strong)">
                  Create your account
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  This email does not have a Tijoir identity yet. Set your name and password once, then join the organization directly.
                </p>
              </div>

              <TextField
                hint="Shown across the workspace and audit log."
                label="Your name"
                onChange={setName}
                value={name}
              />
              <PasswordField
                hint="Use at least 10 characters."
                label="Password"
                onChange={setPassword}
                value={password}
              />

              <div className="flex justify-end">
                <Button
                  disabled={busy || name.trim().length === 0 || password.length < 10}
                  type="submit"
                >
                  {busy ? "Joining..." : "Create account and join"}
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}
    </AuthShell>
  );
}
