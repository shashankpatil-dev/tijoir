"use client";

import { useState } from "react";
import { useDashboardWorkspaceContext } from "@/features/dashboard/components/dashboard-workspace-context";
import { RecipientView } from "@/features/recipient-access/components/recipient-view";
import { useRecipientWorkspace } from "@/features/recipient-access/hooks/use-recipient-workspace";
import type { SecretType } from "@/features/secrets/types/secrets.types";

export default function DashboardRecipientPage() {
  const shell = useDashboardWorkspaceContext();
  const [mode, setMode] = useState<"open" | "create">("open");
  const [createForm, setCreateForm] = useState<{
    secretName: string;
    secretKey: string;
    secretType: SecretType;
    value: string;
    senderLabel: string;
    recipientLabel: string;
    expiryPreset: "24h" | "72h" | "168h";
  }>({
    secretName: "",
    secretKey: "",
    secretType: "PASSWORD",
    value: "",
    senderLabel: "",
    recipientLabel: "",
    expiryPreset: "24h",
  });
  const recipient = useRecipientWorkspace({
    handleSessionError: shell.handleSessionError,
    setActionBusy: shell.setActionBusy,
    setMessage: shell.setMessage,
    showToast: shell.showToast,
  });

  return (
    <RecipientView
      busy={null}
      createdQuickShare={null}
      createForm={createForm}
      copyText={shell.copyText}
      managedQuickShare={null}
      mode={mode}
      onCreateAnother={() => undefined}
      onCreateQuickShare={() => undefined}
      onRevokeQuickShare={() => undefined}
      onConsume={() => void recipient.handleConsumePublicShare()}
      onLoadMetadata={recipient.handleLoadPublicMetadata}
      publicConsumedValue={recipient.publicConsumedValue}
      publicManageToken=""
      publicMetadata={recipient.publicMetadata}
      publicToken={recipient.publicToken}
      setCreateForm={setCreateForm}
      setMode={setMode}
      setPublicToken={recipient.setPublicToken}
    />
  );
}
