import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SelectField } from "@/components/ui/form-fields";
import type { MemberSummary } from "@/features/members/types/members.types";

export function ChangeMemberRoleDialog({
  actionBusy,
  assignableRoles,
  memberRoleValue,
  onClose,
  onSubmit,
  open,
  selectedMember,
  setMemberRoleValue,
}: {
  actionBusy: string | null;
  assignableRoles: string[];
  memberRoleValue: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  open: boolean;
  selectedMember: MemberSummary | null;
  setMemberRoleValue: (value: string) => void;
}) {
  return (
    <Dialog
      description={
        selectedMember
          ? `Update the workspace role for ${selectedMember.email}.`
          : "Update the member role."
      }
      onClose={onClose}
      open={open}
      title="Change member role"
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <SelectField
          label="Role"
          onChange={setMemberRoleValue}
          options={assignableRoles}
          value={memberRoleValue}
        />
        <div className="flex justify-end gap-3">
          <Button onClick={onClose} type="button" variant="ghost">
            Cancel
          </Button>
          <Button disabled={actionBusy !== null} type="submit">
            {actionBusy?.startsWith("member-role-") ? "Updating..." : "Update role"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
