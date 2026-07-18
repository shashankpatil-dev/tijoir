import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SelectField, TextField } from "@/components/ui/form-fields";
import type { SecretSummary } from "@/features/secrets/types/secrets.types";
import type { ContractPermission } from "@/features/share-links/types/share-links.types";
import type {
  VendorContractGrantResponse,
  VendorContractResponse,
  VendorResponse,
} from "@/features/vendors/types/vendors.types";

export function CreateShareLinkDialog({
  activeVendorGrants,
  activeVendorContracts,
  actionBusy,
  contractPermissions,
  onClose,
  onSubmit,
  open,
  secrets,
  setShareContractId,
  setShareExpiry,
  setShareGrantId,
  setSharePermission,
  setShareRecipientLabel,
  setShareSecretId,
  setShareVendorId,
  shareContractId,
  shareExpiry,
  shareGrantId,
  sharePermission,
  shareRecipientLabel,
  shareSecretId,
  shareVendorId,
  vendors,
}: {
  activeVendorGrants: VendorContractGrantResponse[];
  activeVendorContracts: VendorContractResponse[];
  actionBusy: string | null;
  contractPermissions: ContractPermission[];
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  open: boolean;
  secrets: SecretSummary[];
  setShareContractId: (value: string) => void;
  setShareExpiry: (value: string) => void;
  setShareGrantId: (value: string) => void;
  setSharePermission: (value: ContractPermission) => void;
  setShareRecipientLabel: (value: string) => void;
  setShareSecretId: (value: string) => void;
  setShareVendorId: (value: string) => void;
  shareContractId: string;
  shareExpiry: string;
  shareGrantId: string;
  sharePermission: ContractPermission;
  shareRecipientLabel: string;
  shareSecretId: string;
  shareVendorId: string;
  vendors: VendorResponse[];
}) {
  const vendorFlow = Boolean(shareVendorId);
  const grantSelected = Boolean(shareGrantId);

  return (
    <Dialog
      description="Create a direct public or internal share, or route vendor delivery through a contract secret grant."
      onClose={onClose}
      open={open}
      title="Create share link"
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <SelectField
          disabled={grantSelected}
          label="Secret"
          onChange={setShareSecretId}
          options={secrets.map((secret) => ({
            label: `${secret.name} (${secret.secretKey})`,
            value: secret.id,
          }))}
          value={shareSecretId}
        />
        <SelectField
          hint="Optional. Selecting a vendor moves this into the contract-governed vendor flow."
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
          disabled={!vendorFlow}
          hint={
            vendorFlow
              ? "Select the active contract that governs this vendor relationship."
              : "Choose a vendor first to load contract options."
          }
          label="Vendor contract"
          onChange={setShareContractId}
          options={[
            { label: vendorFlow ? "Select contract" : "No vendor selected", value: "" },
            ...activeVendorContracts.map((contract) => ({
              label: `${contract.permission} · ${contract.grantCount} grants`,
              value: contract.id,
            })),
          ]}
          value={shareContractId}
        />
        <SelectField
          disabled={!shareContractId}
          hint={
            shareContractId
              ? "Secret and permission are locked from the selected grant."
              : "Choose a contract first to load secret grants."
          }
          label="Contract secret grant"
          onChange={setShareGrantId}
          options={[
            { label: shareContractId ? "Select grant" : "No contract selected", value: "" },
            ...activeVendorGrants.map((grant) => ({
              label: `${grant.secretName} (${grant.secretKey})`,
              value: grant.id,
            })),
          ]}
          value={shareGrantId}
        />
        <TextField
          label="Recipient label"
          onChange={setShareRecipientLabel}
          required={false}
          value={shareRecipientLabel}
        />
        <SelectField
          disabled={grantSelected}
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
          <Button
            disabled={
              actionBusy !== null ||
              !shareSecretId ||
              (vendorFlow && !shareGrantId)
            }
            type="submit"
          >
            {actionBusy === "create-share-link" ? "Creating..." : "Create share link"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
