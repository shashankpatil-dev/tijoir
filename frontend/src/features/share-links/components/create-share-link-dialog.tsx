import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SelectField, TextField } from "@/components/ui/form-fields";
import type { SecretSummary } from "@/features/secrets/types/secrets.types";
import type { ContractPermission } from "@/features/share-links/types/share-links.types";
import type {
  VendorContractResponse,
  VendorResponse,
} from "@/features/vendors/types/vendors.types";

export function CreateShareLinkDialog({
  activeVendorContracts,
  actionBusy,
  contractPermissions,
  onClose,
  onSubmit,
  open,
  secrets,
  setShareContractId,
  setShareExpiry,
  setSharePermission,
  setShareRecipientLabel,
  setShareSecretId,
  setShareVendorId,
  shareContractId,
  shareExpiry,
  sharePermission,
  shareRecipientLabel,
  shareSecretId,
  shareVendorId,
  vendors,
}: {
  activeVendorContracts: VendorContractResponse[];
  actionBusy: string | null;
  contractPermissions: ContractPermission[];
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  open: boolean;
  secrets: SecretSummary[];
  setShareContractId: (value: string) => void;
  setShareExpiry: (value: string) => void;
  setSharePermission: (value: ContractPermission) => void;
  setShareRecipientLabel: (value: string) => void;
  setShareSecretId: (value: string) => void;
  setShareVendorId: (value: string) => void;
  shareContractId: string;
  shareExpiry: string;
  sharePermission: ContractPermission;
  shareRecipientLabel: string;
  shareSecretId: string;
  shareVendorId: string;
  vendors: VendorResponse[];
}) {
  const contractSelected = Boolean(shareContractId);

  return (
    <Dialog
      description="Issue a public contract-scoped share link for one selected secret."
      onClose={onClose}
      open={open}
      title="Create share link"
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <SelectField
          disabled={contractSelected}
          label="Secret"
          onChange={setShareSecretId}
          options={secrets.map((secret) => ({
            label: `${secret.name} (${secret.secretKey})`,
            value: secret.id,
          }))}
          value={shareSecretId}
        />
        <SelectField
          hint="Optional. Link the share to a tracked vendor for cleaner inventory and offboarding."
          label="Vendor"
          onChange={setShareVendorId}
          options={[
            { label: "No vendor linkage", value: "" },
            ...vendors
              .filter((vendor) => vendor.status === "ACTIVE")
              .map((vendor) => ({
                label: vendor.name,
                value: vendor.id,
              })),
          ]}
          value={shareVendorId}
        />
        <SelectField
          hint="Optional. Selecting a contract locks the secret and permission to that contract."
          label="Vendor contract"
          onChange={setShareContractId}
          options={[
            { label: "No contract linkage", value: "" },
            ...activeVendorContracts.map((contract) => ({
              label: `${contract.secretName} (${contract.permission})`,
              value: contract.id,
            })),
          ]}
          value={shareContractId}
        />
        <TextField
          label="Recipient label"
          onChange={setShareRecipientLabel}
          required={false}
          value={shareRecipientLabel}
        />
        <SelectField
          disabled={contractSelected}
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
