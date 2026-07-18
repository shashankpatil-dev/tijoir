import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SelectField, TextField } from "@/components/ui/form-fields";
import type { ContractPermission } from "@/features/share-links/types/share-links.types";
import type { SecretSummary } from "@/features/secrets/types/secrets.types";
import type { VendorContractResponse } from "@/features/vendors/types/vendors.types";

export function CreateVendorContractGrantDialog({
  actionBusy,
  grantExpiry,
  grantPermission,
  grantPermissions,
  grantSecretId,
  onClose,
  onSubmit,
  open,
  secrets,
  selectedContract,
  setGrantExpiry,
  setGrantPermission,
  setGrantSecretId,
}: {
  actionBusy: string | null;
  grantExpiry: string;
  grantPermission: string;
  grantPermissions: ContractPermission[];
  grantSecretId: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  open: boolean;
  secrets: SecretSummary[];
  selectedContract: VendorContractResponse | null;
  setGrantExpiry: (value: string) => void;
  setGrantPermission: (value: string) => void;
  setGrantSecretId: (value: string) => void;
}) {
  return (
    <Dialog
      description={
        selectedContract
          ? `Attach another secret to ${selectedContract.vendorName} under the selected contract boundary.`
          : "Select a contract first."
      }
      onClose={onClose}
      open={open}
      title="Create contract secret grant"
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <SelectField
          label="Secret"
          onChange={setGrantSecretId}
          options={secrets.map((secret) => ({
            label: `${secret.name} (${secret.secretKey})`,
            value: secret.id,
          }))}
          value={grantSecretId}
        />
        <SelectField
          label="Permission"
          onChange={setGrantPermission}
          options={grantPermissions}
          value={grantPermission}
        />
        <TextField
          hint="Optional. Leave blank to inherit the contract expiry if present."
          label="Expiry"
          onChange={setGrantExpiry}
          required={false}
          type="datetime-local"
          value={grantExpiry}
        />
        <div className="flex justify-end gap-3">
          <Button onClick={onClose} type="button" variant="ghost">
            Cancel
          </Button>
          <Button
            disabled={actionBusy !== null || !selectedContract || !grantSecretId}
            type="submit"
          >
            {actionBusy === "create-vendor-contract-grant" ? "Creating..." : "Create grant"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
