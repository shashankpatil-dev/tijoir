import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { TextAreaField, TextField } from "@/components/ui/form-fields";

export function CreateVendorDialog({
  actionBusy,
  contactEmail,
  contactName,
  linkedOrganizationSlug,
  name,
  notes,
  onClose,
  onSubmit,
  open,
  setContactEmail,
  setContactName,
  setLinkedOrganizationSlug,
  setName,
  setNotes,
}: {
  actionBusy: string | null;
  contactEmail: string;
  contactName: string;
  linkedOrganizationSlug: string;
  name: string;
  notes: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  open: boolean;
  setContactEmail: (value: string) => void;
  setContactName: (value: string) => void;
  setLinkedOrganizationSlug: (value: string) => void;
  setName: (value: string) => void;
  setNotes: (value: string) => void;
}) {
  return (
    <Dialog
      description="Create the vendor record before issuing contracts or public share links."
      onClose={onClose}
      open={open}
      title="Create vendor"
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <TextField label="Vendor name" onChange={setName} value={name} />
        <TextField
          label="Contact name"
          onChange={setContactName}
          required={false}
          value={contactName}
        />
        <TextField
          label="Contact email"
          onChange={setContactEmail}
          required={false}
          type="email"
          value={contactEmail}
        />
        <TextField
          hint="Optional. Set the onboarded organization slug here when this vendor should accept contract proposals as a counterparty org."
          label="Counterparty org slug"
          onChange={setLinkedOrganizationSlug}
          required={false}
          value={linkedOrganizationSlug}
        />
        <TextAreaField
          hint="Internal operator notes for this vendor relationship."
          label="Notes"
          onChange={setNotes}
          required={false}
          rows={4}
          value={notes}
        />
        <div className="flex justify-end gap-3">
          <Button onClick={onClose} type="button" variant="ghost">
            Cancel
          </Button>
          <Button disabled={actionBusy !== null || !name.trim()} type="submit">
            {actionBusy === "create-vendor" ? "Creating..." : "Create vendor"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
