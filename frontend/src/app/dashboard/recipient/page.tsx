"use client";

import { useDashboardWorkspaceContext } from "@/features/dashboard/components/dashboard-workspace-context";
import { RecipientView } from "@/features/recipient-access/components/recipient-view";
import { useRecipientWorkspace } from "@/features/recipient-access/hooks/use-recipient-workspace";

export default function DashboardRecipientPage() {
  const shell = useDashboardWorkspaceContext();
  const recipient = useRecipientWorkspace({
    handleSessionError: shell.handleSessionError,
    setActionBusy: shell.setActionBusy,
    setMessage: shell.setMessage,
    showToast: shell.showToast,
  });

  return (
    <RecipientView
      copyText={shell.copyText}
      onConsume={() => void recipient.handleConsumePublicShare()}
      onLoadMetadata={recipient.handleLoadPublicMetadata}
      publicConsumedValue={recipient.publicConsumedValue}
      publicMetadata={recipient.publicMetadata}
      publicToken={recipient.publicToken}
      setPublicToken={recipient.setPublicToken}
    />
  );
}
