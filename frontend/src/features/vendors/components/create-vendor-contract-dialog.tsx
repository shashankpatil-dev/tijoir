import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SelectField, TextField } from "@/components/ui/form-fields";
import type { ContractPermission } from "@/features/share-links/types/share-links.types";
import type { SecretSummary } from "@/features/secrets/types/secrets.types";
import type { VendorResponse } from "@/features/vendors/types/vendors.types";

export function CreateVendorContractDialog({
  actionBusy,
  contractExpiry,
  contractPermission,
  contractSecretId,
  contractPermissions,
  onClose,
  onSubmit,
  open,
  secrets,
  selectedVendor,
  setContractExpiry,
  setContractPermission,
  setContractSecretId,
}: {
  actionBusy: string | null;
  contractExpiry: string;
  contractPermission: string;
  contractSecretId: string;
  contractPermissions: ContractPermission[];
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  open: boolean;
  secrets: SecretSummary[];
  selectedVendor: VendorResponse | null;
  setContractExpiry: (value: string) => void;
  setContractPermission: (value: string) => void;
  setContractSecretId: (value: string) => void;
}) {
  return (
    <Dialog
      description={
        selectedVendor
          ? `Bind one vault secret to ${selectedVendor.name} with an explicit permission contract.`
          : "Select a vendor first."
      }
      onClose={onClose}
      open={open}
      title="Create vendor contract"
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <SelectField
          label="Secret"
          onChange={setContractSecretId}
          options={secrets.map((secret) => ({
            label: `${secret.name} (${secret.secretKey})`,
            value: secret.id,
          }))}
          value={contractSecretId}
        />
        <SelectField
          label="Permission"
          onChange={setContractPermission}
          options={contractPermissions}
          value={contractPermission}
        />
        <TextField
          hint="Optional. Leave blank for a contract that stays active until revoked or policy closure."
          label="Expiry"
          onChange={setContractExpiry}
          required={false}
          type="datetime-local"
          value={contractExpiry}
        />
        <div className="flex justify-end gap-3">
          <Button onClick={onClose} type="button" variant="ghost">
            Cancel
          </Button>
          <Button
            disabled={actionBusy !== null || !selectedVendor || !contractSecretId}
            type="submit"
          >
            {actionBusy === "create-vendor-contract" ? "Creating..." : "Create contract"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
