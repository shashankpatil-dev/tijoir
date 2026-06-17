"use client";

import { useDashboardWorkspaceContext } from "@/features/dashboard/components/dashboard-workspace-context";
import { AuditView } from "@/features/audit/components/audit-view";

export default function DashboardAuditPage() {
  const workspace = useDashboardWorkspaceContext();

  return (
    <AuditView
      auditActionFilter={workspace.auditActionFilter}
      auditColumns={workspace.auditColumns}
      auditEvents={workspace.auditEvents}
      auditPage={workspace.auditPage}
      auditPageCount={workspace.auditPageCount}
      auditQuery={workspace.auditQuery}
      auditReport={workspace.auditReport}
      auditResourceTypeFilter={workspace.auditResourceTypeFilter}
      auditTotal={workspace.auditTotal}
      handleAuditExport={workspace.handleAuditExport}
      loadingWorkspace={workspace.loadingWorkspace}
      setAuditActionFilter={workspace.setAuditActionFilter}
      setAuditPage={workspace.setAuditPage}
      setAuditQuery={workspace.setAuditQuery}
      setAuditResourceTypeFilter={workspace.setAuditResourceTypeFilter}
    />
  );
}
