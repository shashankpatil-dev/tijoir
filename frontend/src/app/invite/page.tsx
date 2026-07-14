"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { GuestRoute } from "@/components/auth/auth-guards";
import { AuthShell, StatusPanel } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { PasswordField, TextField } from "@/components/ui/form-fields";
import { useToast } from "@/components/ui/toast-provider";
import { apiRequest, saveSession, type AuthResponse } from "@/lib/auth-client";

export default function InvitePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const queryToken = new URLSearchParams(window.location.search).get("token");
    if (queryToken) {
      setToken(queryToken);
    }
  }, []);

  async function acceptInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);

    try {
      const result = await apiRequest<AuthResponse>("/api/organization/invites/accept", {
        method: "POST",
        body: JSON.stringify({ token, name, password }),
      });

      saveSession(result);
      showToast({
        title: "Invite accepted",
        description: "The organization session is ready. Redirecting to the dashboard.",
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

  return (
    <GuestRoute>
      <AuthShell
        aside={
          <div className="space-y-4">
            <StatusPanel
              title="You've been invited"
              body="Set your name and password to join the organization — your role is already set by the invite."
            />
            <StatusPanel
              title="Time-limited"
              body="Expired or revoked invites won't work. Ask your admin to resend if it fails."
            />
          </div>
        }
        description="Accept your invite and jump straight into the workspace."
        eyebrow="You're invited"
        title="Join your team on Tijoir"
      >
        <form className="space-y-4" onSubmit={acceptInvite}>
          <div>
            <h2 className="text-2xl font-semibold text-(--color-ink-strong)">
              Set up your account
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Just your name and a password — the invite handles the rest.
            </p>
          </div>

          <TextField
            hint="Comes from your invite link — usually already filled in."
            label="Invite token"
            onChange={setToken}
            value={token}
          />
          <TextField
            hint="Shown in the member list and audit log."
            label="Your name"
            onChange={setName}
            value={name}
          />
          <PasswordField
            hint="Use at least 10 characters with a strong mix."
            label="Password"
            onChange={setPassword}
            value={password}
          />

          <div className="flex justify-end">
            <Button disabled={busy} type="submit">
              {busy ? "Joining..." : "Accept invite"}
            </Button>
          </div>
        </form>
      </AuthShell>
    </GuestRoute>
  );
}
