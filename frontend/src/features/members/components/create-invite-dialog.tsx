import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SelectField, TextField } from "@/components/ui/form-fields";

export function CreateInviteDialog({
  actionBusy,
  assignableRoles,
  inviteEmail,
  inviteRole,
  onClose,
  onSubmit,
  open,
  setInviteEmail,
  setInviteRole,
}: {
  actionBusy: string | null;
  assignableRoles: string[];
  inviteEmail: string;
  inviteRole: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  open: boolean;
  setInviteEmail: (value: string) => void;
  setInviteRole: (value: string) => void;
}) {
  return (
    <Dialog
      description="Create a new organization invite and stage the accept URL for the recipient."
      onClose={onClose}
      open={open}
      title="Invite member"
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <TextField
          hint="The invite token and accept URL are generated for this email."
          label="Invitee email"
          onChange={setInviteEmail}
          type="email"
          value={inviteEmail}
        />
        <SelectField
          label="Role"
          onChange={setInviteRole}
          options={assignableRoles}
          value={inviteRole}
        />
        <div className="flex justify-end gap-3">
          <Button onClick={onClose} type="button" variant="ghost">
            Cancel
          </Button>
          <Button disabled={actionBusy !== null || !inviteEmail.trim()} type="submit">
            {actionBusy === "create-invite" ? "Creating..." : "Create invite"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
