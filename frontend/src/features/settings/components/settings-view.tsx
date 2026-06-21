import {
  PageSection,
  SurfaceNoteListSkeleton,
} from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { InlineMessage } from "@/components/ui/feedback";
import { PasswordField, SelectField, TextField } from "@/components/ui/form-fields";
import { SurfaceNote } from "@/features/dashboard/components/surface-note";
import { formatInstant } from "@/features/dashboard/lib/dashboard-format";
import type { FormEvent } from "react";
import type { MfaSecurityState } from "@/features/settings/types/settings.types";

export function SettingsView({
  allowRotationNotifyOnly,
  allowViewOnce,
  allowViewUntilRevoked,
  defaultShareLinkExpiryHours,
  handleUpdatePolicy,
  loadingPolicy,
  mfa,
  policyUpdatedAt,
  requireVendorContractForShareLinks,
  rotationReminderDays,
  setAllowRotationNotifyOnly,
  setAllowViewOnce,
  setAllowViewUntilRevoked,
  setDefaultShareLinkExpiryHours,
  setRequireVendorContractForShareLinks,
  setRotationReminderDays,
}: {
  allowRotationNotifyOnly: string;
  allowViewOnce: string;
  allowViewUntilRevoked: string;
  defaultShareLinkExpiryHours: string;
  handleUpdatePolicy: (event: FormEvent<HTMLFormElement>) => void;
  loadingPolicy: boolean;
  mfa: {
    confirmEnrollment: (event: FormEvent<HTMLFormElement>) => void;
    disable: (event: FormEvent<HTMLFormElement>) => void;
    disableBusy: boolean;
    disableCode: string;
    disableOpen: boolean;
    disablePassword: string;
    enabled: boolean;
    enrolledAt?: string | null;
    enrollmentBusy: boolean;
    enrollmentCode: string;
    enrollmentOpen: boolean;
    loading: boolean;
    openDisable: () => void;
    openEnrollment: () => void;
    setDisableCode: (value: string) => void;
    setDisableOpen: (value: boolean) => void;
    setDisablePassword: (value: string) => void;
    setEnrollmentCode: (value: string) => void;
    setEnrollmentOpen: (value: boolean) => void;
    setup: MfaSecurityState | null;
  };
  policyUpdatedAt?: string | null;
  requireVendorContractForShareLinks: string;
  rotationReminderDays: string;
  setAllowRotationNotifyOnly: (value: string) => void;
  setAllowViewOnce: (value: string) => void;
  setAllowViewUntilRevoked: (value: string) => void;
  setDefaultShareLinkExpiryHours: (value: string) => void;
  setRequireVendorContractForShareLinks: (value: string) => void;
  setRotationReminderDays: (value: string) => void;
}) {
  const booleanOptions = [
    { label: "Enabled", value: "true" },
    { label: "Disabled", value: "false" },
  ];
  const showLoadingState =
    loadingPolicy &&
    !policyUpdatedAt &&
    defaultShareLinkExpiryHours === "" &&
    rotationReminderDays === "30";

  return (
    <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <PageSection
        description="Set the default organization rules for share duration, permission modes, and rotation review."
        title="Organization policy"
      >
        {showLoadingState ? (
          <SurfaceNoteListSkeleton rows={5} />
        ) : (
          <form className="space-y-4" onSubmit={handleUpdatePolicy}>
            <TextField
              hint="Optional default expiry in hours for share links."
              label="Default share-link expiry hours"
              onChange={setDefaultShareLinkExpiryHours}
              required={false}
              type="number"
              value={defaultShareLinkExpiryHours}
            />
            <SelectField
              hint="If enabled, share links should only be issued through an active vendor contract."
              label="Require vendor contract for share links"
              onChange={setRequireVendorContractForShareLinks}
              options={booleanOptions}
              value={requireVendorContractForShareLinks}
            />
            <SelectField
              label="Allow VIEW_ONCE"
              onChange={setAllowViewOnce}
              options={booleanOptions}
              value={allowViewOnce}
            />
            <SelectField
              label="Allow VIEW_UNTIL_REVOKED"
              onChange={setAllowViewUntilRevoked}
              options={booleanOptions}
              value={allowViewUntilRevoked}
            />
            <SelectField
              label="Allow ROTATION_NOTIFY_ONLY"
              onChange={setAllowRotationNotifyOnly}
              options={booleanOptions}
              value={allowRotationNotifyOnly}
            />
            <TextField
              hint="Reminder lead time in days before secret rotation should be reviewed."
              label="Rotation reminder days"
              onChange={setRotationReminderDays}
              required={false}
              type="number"
              value={rotationReminderDays}
            />
            <div className="flex justify-end">
              <Button type="submit">Save policy</Button>
            </div>
          </form>
        )}
      </PageSection>

      <div className="space-y-5">
        <PageSection
          description="Protect the current account with an authenticator app. Enrollment and login challenge state stays short-lived, while the durable shared secret is encrypted on the account."
          title="Account security"
        >
          {mfa.loading ? (
            <SurfaceNoteListSkeleton rows={4} />
          ) : (
            <div className="space-y-4">
              <SurfaceNote
                label="MFA status"
                value={mfa.enabled ? "Enabled" : "Disabled"}
              />
              <SurfaceNote
                label="Enrolled at"
                value={mfa.enrolledAt ? formatInstant(mfa.enrolledAt) : "Not enrolled"}
              />
              <SurfaceNote
                label="Login behavior"
                value={
                  mfa.enabled
                    ? "Password step is followed by authenticator verification."
                    : "Password-only login is currently active."
                }
              />
              {mfa.enabled ? (
                <Button onClick={mfa.openDisable} type="button" variant="danger">
                  Disable MFA
                </Button>
              ) : (
                <Button onClick={mfa.openEnrollment} type="button">
                  Enable MFA
                </Button>
              )}
            </div>
          )}
        </PageSection>

        <PageSection
          description="A compact readout of the currently staged organization policy."
          title="Current policy"
        >
          {showLoadingState ? (
            <SurfaceNoteListSkeleton rows={5} />
          ) : (
            <div className="space-y-3">
              <SurfaceNote
                label="Default expiry"
                value={
                  defaultShareLinkExpiryHours
                    ? `${defaultShareLinkExpiryHours} hours`
                    : "No default expiry enforced"
                }
              />
              <SurfaceNote
                label="Vendor contract required"
                value={requireVendorContractForShareLinks === "true" ? "Yes" : "No"}
              />
              <SurfaceNote
                label="Allowed modes"
                value={[
                  allowViewOnce === "true" ? "VIEW_ONCE" : null,
                  allowViewUntilRevoked === "true" ? "VIEW_UNTIL_REVOKED" : null,
                  allowRotationNotifyOnly === "true" ? "ROTATION_NOTIFY_ONLY" : null,
                ]
                  .filter(Boolean)
                  .join(", ") || "None"}
              />
              <SurfaceNote
                label="Rotation reminder"
                value={
                  rotationReminderDays
                    ? `${rotationReminderDays} days before review`
                    : "No reminder window set"
                }
              />
              <SurfaceNote
                label="Last updated"
                value={policyUpdatedAt ? formatInstant(policyUpdatedAt) : "Default policy"}
              />
            </div>
          )}
        </PageSection>

        <PageSection
          description="Use policy defaults to reduce unsafe sharing and keep operators inside one consistent workflow."
          title="Policy guardrails"
        >
          <div className="space-y-3">
            <SurfaceNote
              label="Default expiry"
              value="Use a short default duration when recipient access is temporary or task-based."
            />
            <SurfaceNote
              label="Contract requirement"
              value="Require a vendor contract when each share should trace back to a known external party."
            />
            <SurfaceNote
              label="Permission modes"
              value="Keep only the permission types the organization actually intends to support."
            />
          </div>
        </PageSection>

        <PageSection
          description="Use one clear policy posture so operators do not need to guess how access should be issued."
          title="Operating guidance"
        >
          <div className="space-y-3">
            <SurfaceNote
              label="Temporary access"
              value="Use short expiries and tighter permission modes for task-based or vendor onboarding work."
            />
            <SurfaceNote
              label="Stable integrations"
              value="Use a contract-backed path when a relationship is ongoing and needs traceable ownership."
            />
            <SurfaceNote
              label="Rotation posture"
              value="Keep reminder windows realistic enough that teams review secrets before external breakage happens."
            />
          </div>
        </PageSection>
      </div>

      <Dialog
        description="Register the shared secret in your authenticator app, then confirm with the current 6-digit code."
        onClose={() => mfa.setEnrollmentOpen(false)}
        open={mfa.enrollmentOpen}
        title="Enable MFA"
      >
        <form className="space-y-4" onSubmit={mfa.confirmEnrollment}>
          <InlineMessage
            body="Redis stores only the short-lived challenge state. The durable MFA secret is encrypted on the user account."
            title="Storage model"
            tone="neutral"
          />
          <div className="space-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-sm font-medium text-[var(--color-ink)]">Shared secret</p>
            <p className="break-all font-mono text-sm text-[var(--color-ink-strong)]">
              {mfa.setup?.secret || "Pending"}
            </p>
          </div>
          <div className="space-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-sm font-medium text-[var(--color-ink)]">OTP URI</p>
            <p className="break-all font-mono text-xs text-[var(--color-ink-strong)]">
              {mfa.setup?.otpauthUri || "Pending"}
            </p>
          </div>
          <SurfaceNote
            label="Challenge expiry"
            value={
              mfa.setup?.expiresAt
                ? formatInstant(mfa.setup.expiresAt)
                : "This challenge expires shortly."
            }
          />
          <TextField
            hint="Use the current 6-digit code from the authenticator app."
            label="Authenticator code"
            onChange={mfa.setEnrollmentCode}
            value={mfa.enrollmentCode}
          />
          <div className="flex justify-end gap-3">
            <Button
              onClick={() => mfa.setEnrollmentOpen(false)}
              type="button"
              variant="secondary"
            >
              Cancel
            </Button>
            <Button disabled={mfa.enrollmentBusy} type="submit">
              Confirm MFA
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        description="Confirm the current password and a valid authenticator code to disable MFA for this account."
        onClose={() => mfa.setDisableOpen(false)}
        open={mfa.disableOpen}
        title="Disable MFA"
      >
        <form className="space-y-4" onSubmit={mfa.disable}>
          <PasswordField
            hint="Use the current account password."
            label="Current password"
            onChange={mfa.setDisablePassword}
            value={mfa.disablePassword}
          />
          <TextField
            hint="Use the latest 6-digit authenticator code."
            label="Authenticator code"
            onChange={mfa.setDisableCode}
            value={mfa.disableCode}
          />
          <div className="flex justify-end gap-3">
            <Button
              onClick={() => mfa.setDisableOpen(false)}
              type="button"
              variant="secondary"
            >
              Cancel
            </Button>
            <Button disabled={mfa.disableBusy} type="submit" variant="danger">
              Disable MFA
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
