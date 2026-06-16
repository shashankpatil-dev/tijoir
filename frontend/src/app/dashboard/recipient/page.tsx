"use client";

import { useDashboardWorkspaceContext } from "@/features/dashboard/components/dashboard-workspace-context";
import { RecipientView } from "@/features/recipient-access/components/recipient-view";

export default function DashboardRecipientPage() {
  const workspace = useDashboardWorkspaceContext();

  return (
    <RecipientView
      copyText={workspace.copyText}
      onConsume={() => void workspace.handleConsumePublicShare()}
      onLoadMetadata={workspace.handleLoadPublicMetadata}
      publicConsumedValue={workspace.publicConsumedValue}
      publicMetadata={workspace.publicMetadata}
      publicToken={workspace.publicToken}
      setPublicToken={workspace.setPublicToken}
    />
  );
}
