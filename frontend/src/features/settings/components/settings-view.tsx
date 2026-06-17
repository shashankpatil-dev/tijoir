import { PageSection } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/form-fields";
import { SurfaceNote } from "@/features/dashboard/components/surface-note";
import { formatInstant } from "@/features/dashboard/lib/dashboard-format";
import type { FormEvent } from "react";

export function SettingsView({
  allowRotationNotifyOnly,
  allowViewOnce,
  allowViewUntilRevoked,
  defaultShareLinkExpiryHours,
  handleUpdatePolicy,
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

  return (
    <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <PageSection
        description="Set the default organization rules for share duration, permission modes, and rotation review."
        title="Policy configuration"
      >
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
      </PageSection>

      <div className="space-y-5">
        <PageSection
          description="A compact readout of the currently staged organization policy."
          title="Policy summary"
        >
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
      </div>
    </div>
  );
}
