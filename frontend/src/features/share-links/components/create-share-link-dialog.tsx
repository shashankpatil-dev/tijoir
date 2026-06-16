import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SelectField, TextField } from "@/components/ui/form-fields";
import type { SecretSummary } from "@/features/secrets/types/secrets.types";
import type {
  ContractPermission,
} from "@/features/share-links/types/share-links.types";

export function CreateShareLinkDialog({
  actionBusy,
  contractPermissions,
  onClose,
  onSubmit,
  open,
  secrets,
  setShareExpiry,
  setSharePermission,
  setShareRecipientLabel,
  setShareSecretId,
  shareExpiry,
  sharePermission,
  shareRecipientLabel,
  shareSecretId,
}: {
  actionBusy: string | null;
  contractPermissions: ContractPermission[];
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  open: boolean;
  secrets: SecretSummary[];
  setShareExpiry: (value: string) => void;
  setSharePermission: (value: ContractPermission) => void;
  setShareRecipientLabel: (value: string) => void;
  setShareSecretId: (value: string) => void;
  shareExpiry: string;
  sharePermission: ContractPermission;
  shareRecipientLabel: string;
  shareSecretId: string;
}) {
  return (
    <Dialog
      description="Issue a public contract-scoped share link for one selected secret."
      onClose={onClose}
      open={open}
      title="Create share link"
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <SelectField
          label="Secret"
          onChange={setShareSecretId}
          options={secrets.map((secret) => ({
            label: `${secret.name} (${secret.secretKey})`,
            value: secret.id,
          }))}
          value={shareSecretId}
        />
        <TextField
          label="Recipient label"
          onChange={setShareRecipientLabel}
          required={false}
          value={shareRecipientLabel}
        />
        <SelectField
          label="Permission"
          onChange={(value) => setSharePermission(value as ContractPermission)}
          options={contractPermissions}
          value={sharePermission}
        />
        <TextField
          hint="Optional. If omitted, the contract remains open until revoke or policy closure."
          label="Expiry"
          onChange={setShareExpiry}
          required={false}
          type="datetime-local"
          value={shareExpiry}
        />
        <div className="flex justify-end gap-3">
          <Button onClick={onClose} type="button" variant="ghost">
            Cancel
          </Button>
          <Button disabled={actionBusy !== null || !shareSecretId} type="submit">
            {actionBusy === "create-share-link" ? "Creating..." : "Create share link"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
