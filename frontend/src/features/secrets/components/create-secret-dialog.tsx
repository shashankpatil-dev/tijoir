import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/form-fields";
import type { FormEvent } from "react";
import type { SecretType } from "@/features/secrets/types/secrets.types";

export function CreateSecretDialog({
  actionBusy,
  createDescription,
  createName,
  createType,
  createValue,
  generateLength,
  generatorEnabled,
  onClose,
  onGenerate,
  onSubmit,
  open,
  secretTypes,
  setCreateDescription,
  setCreateName,
  setCreateType,
  setCreateValue,
  setGenerateLength,
}: {
  actionBusy: string | null;
  createDescription: string;
  createName: string;
  createType: SecretType;
  createValue: string;
  generateLength: string;
  generatorEnabled: boolean;
  onClose: () => void;
  onGenerate: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  open: boolean;
  secretTypes: SecretType[];
  setCreateDescription: (value: string) => void;
  setCreateName: (value: string) => void;
  setCreateType: (value: SecretType) => void;
  setCreateValue: (value: string) => void;
  setGenerateLength: (value: string) => void;
}) {
  return (
    <Dialog
      description="Create a new vault secret and optionally generate a candidate value in the same flow."
      onClose={onClose}
      open={open}
      title="Create secret"
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <TextField label="Secret name" onChange={setCreateName} value={createName} />
        <SelectField
          label="Secret type"
          onChange={(value) => setCreateType(value as SecretType)}
          options={secretTypes}
          value={createType}
        />
        <TextAreaField
          label="Description"
          onChange={setCreateDescription}
          required={false}
          rows={3}
          value={createDescription}
        />
        <div className="grid gap-3 sm:grid-cols-[1fr_140px_auto] sm:items-end">
          <TextAreaField
            label="Secret value"
            onChange={setCreateValue}
            rows={6}
            value={createValue}
          />
          <TextField
            label="Length"
            onChange={setGenerateLength}
            type="number"
            value={generateLength}
          />
          <Button
            disabled={actionBusy !== null || !generatorEnabled}
            onClick={onGenerate}
            type="button"
            variant="secondary"
          >
            Generate
          </Button>
        </div>
        <div className="flex justify-end gap-3">
          <Button onClick={onClose} type="button" variant="ghost">
            Cancel
          </Button>
          <Button disabled={actionBusy !== null} type="submit" variant="primary">
            {actionBusy === "create-secret" ? "Creating..." : "Create secret"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
