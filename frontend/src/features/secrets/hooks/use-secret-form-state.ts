import { useState } from "react";
import type { SecretType } from "@/features/secrets/types/secrets.types";

export function useSecretFormState() {
  const [createSecretOpen, setCreateSecretOpen] = useState(false);
  const [rotateDialogOpen, setRotateDialogOpen] = useState(false);
  const [createName, setCreateName] = useState("Vendor API Key");
  const [createType, setCreateType] = useState<SecretType>("API_KEY");
  const [createDescription, setCreateDescription] = useState(
    "Used by the primary integration vendor",
  );
  const [createValue, setCreateValue] = useState("");
  const [generateLength, setGenerateLength] = useState("32");
  const [rotateValue, setRotateValue] = useState("");

  return {
    createDescription,
    createName,
    createSecretOpen,
    createType,
    createValue,
    generateLength,
    rotateDialogOpen,
    rotateValue,
    setCreateDescription,
    setCreateName,
    setCreateSecretOpen,
    setCreateType,
    setCreateValue,
    setGenerateLength,
    setRotateDialogOpen,
    setRotateValue,
  };
}
