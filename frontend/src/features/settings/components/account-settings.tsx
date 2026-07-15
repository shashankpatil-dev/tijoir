"use client";

import { type FormEvent, useState } from "react";
import { PageSection } from "@/components/dashboard/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DefinitionRows } from "@/components/dashboard/dashboard-shell";
import { PasswordField, TextField } from "@/components/ui/form-fields";
import { GoogleButton } from "@/features/auth/components/google-button";
import {
  changePasswordRequest,
  googleLinkRequest,
  updateOrganizationRequest,
  updateProfileRequest,
} from "@/features/auth/api/auth.api";
import type { ShowToast } from "@/features/dashboard/hooks/workspace.types";

export function AccountSettings({
  accessToken,
  currentName,
  email,
  role,
  isManager,
  organizationName,
  showToast,
}: {
  accessToken: string;
  currentName: string;
  email: string;
  role: string;
  isManager: boolean;
  organizationName: string;
  showToast: ShowToast;
}) {
  const [name, setName] = useState(currentName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [orgName, setOrgName] = useState(organizationName);
  const [busy, setBusy] = useState<string | null>(null);

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("name");
    try {
      await updateProfileRequest(accessToken, name.trim());
      showToast({ title: "Name updated", description: "Reload to see it everywhere.", tone: "success" });
    } catch (error) {
      showToast({
        title: "Couldn't update name",
        description: error instanceof Error ? error.message : "Try again",
        tone: "error",
      });
    } finally {
      setBusy(null);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("password");
    try {
      await changePasswordRequest(accessToken, currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      showToast({ title: "Password updated", description: "Your other sessions were signed out.", tone: "success" });
    } catch (error) {
      showToast({
        title: "Couldn't change password",
        description: error instanceof Error ? error.message : "Try again",
        tone: "error",
      });
    } finally {
      setBusy(null);
    }
  }

  async function connectGoogle(idToken: string) {
    setBusy("google");
    try {
      await googleLinkRequest(accessToken, idToken);
      showToast({ title: "Google connected", description: "You can now sign in with Google.", tone: "success" });
    } catch (error) {
      showToast({
        title: "Couldn't connect Google",
        description: error instanceof Error ? error.message : "Try again",
        tone: "error",
      });
    } finally {
      setBusy(null);
    }
  }

  async function saveOrgName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("org");
    try {
      await updateOrganizationRequest(accessToken, orgName.trim());
      showToast({ title: "Organization renamed", description: "Reload to see it everywhere.", tone: "success" });
    } catch (error) {
      showToast({
        title: "Couldn't rename organization",
        description: error instanceof Error ? error.message : "Try again",
        tone: "error",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <PageSection title="Account">
        <div className="space-y-5">
          <DefinitionRows
            items={[
              { label: "Email", value: email },
              { label: "Role", value: <Badge tone="info">{role}</Badge> },
            ]}
          />

          <form className="space-y-3" onSubmit={saveName}>
            <TextField label="Display name" onChange={setName} value={name} />
            <div className="flex justify-end">
              <Button disabled={busy === "name" || name.trim().length === 0} type="submit">
                {busy === "name" ? "Saving…" : "Save name"}
              </Button>
            </div>
          </form>

          <div className="border-t border-[var(--color-border)] pt-5">
            <p className="text-sm font-semibold text-(--color-ink-strong)">Password</p>
            <form className="mt-3 space-y-3" onSubmit={changePassword}>
              <PasswordField
                hint="Leave blank if you signed up with Google and are setting a password for the first time."
                label="Current password"
                onChange={setCurrentPassword}
                value={currentPassword}
              />
              <PasswordField label="New password" onChange={setNewPassword} value={newPassword} />
              <div className="flex justify-end">
                <Button disabled={busy === "password" || newPassword.length < 10} type="submit">
                  {busy === "password" ? "Updating…" : "Update password"}
                </Button>
              </div>
            </form>
          </div>

          <div className="border-t border-[var(--color-border)] pt-5">
            <p className="text-sm font-semibold text-(--color-ink-strong)">Connect Google</p>
            <p className="mt-1 mb-3 text-sm text-muted">
              Link your Google account to sign in with one click.
            </p>
            <GoogleButton onToken={connectGoogle} text="continue_with" />
          </div>
        </div>
      </PageSection>

      {isManager ? (
        <PageSection title="Organization">
          <form className="space-y-3" onSubmit={saveOrgName}>
            <TextField label="Organization name" onChange={setOrgName} value={orgName} />
            <div className="flex justify-end">
              <Button disabled={busy === "org" || orgName.trim().length === 0} type="submit">
                {busy === "org" ? "Saving…" : "Save organization name"}
              </Button>
            </div>
          </form>
        </PageSection>
      ) : null}
    </div>
  );
}
