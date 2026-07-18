import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SelectField, TextField } from "@/components/ui/form-fields";
import type { ContractPermission } from "@/features/share-links/types/share-links.types";
import type { VendorResponse } from "@/features/vendors/types/vendors.types";

export function CreateVendorContractDialog({
  actionBusy,
  contractExpiry,
  contractPermission,
  contractPermissions,
  onClose,
  onSubmit,
  open,
  selectedVendor,
  setContractExpiry,
  setContractPermission,
}: {
  actionBusy: string | null;
  contractExpiry: string;
  contractPermission: string;
  contractPermissions: ContractPermission[];
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  open: boolean;
  selectedVendor: VendorResponse | null;
  setContractExpiry: (value: string) => void;
  setContractPermission: (value: string) => void;
}) {
  return (
    <Dialog
      description={
        selectedVendor
          ? `Create the permission boundary for ${selectedVendor.name}. Secret access is attached later through grants.`
          : "Select a vendor first."
      }
      onClose={onClose}
      open={open}
      title="Create vendor contract"
    >
      <form className="space-y-4" onSubmit={onSubmit}>
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
          <Button disabled={actionBusy !== null || !selectedVendor} type="submit">
            {actionBusy === "create-vendor-contract" ? "Creating..." : "Create contract"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
