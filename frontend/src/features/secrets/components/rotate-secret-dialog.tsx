import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { TextAreaField } from "@/components/ui/form-fields";

export function RotateSecretDialog({
  actionBusy,
  onClose,
  onSubmit,
  open,
  rotateValue,
  setRotateValue,
}: {
  actionBusy: string | null;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  open: boolean;
  rotateValue: string;
  setRotateValue: (value: string) => void;
}) {
  return (
    <Dialog
      description="Create a new active version for the selected secret."
      onClose={onClose}
      open={open}
      title="Rotate secret"
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <TextAreaField
          label="New secret value"
          onChange={setRotateValue}
          rows={8}
          value={rotateValue}
        />
        <div className="flex justify-end gap-3">
          <Button onClick={onClose} type="button" variant="ghost">
            Cancel
          </Button>
          <Button disabled={actionBusy !== null} type="submit" variant="primary">
            {actionBusy?.startsWith("rotate-") ? "Rotating..." : "Rotate secret"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
