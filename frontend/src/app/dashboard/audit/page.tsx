"use client";

import { useDashboardWorkspaceContext } from "@/features/dashboard/components/dashboard-workspace-context";
import { AuditView } from "@/features/audit/components/audit-view";
import { useAuditWorkspace } from "@/features/audit/hooks/use-audit-workspace";

export default function DashboardAuditPage() {
  const shell = useDashboardWorkspaceContext();
  const audit = useAuditWorkspace({
    handleSessionError: shell.handleSessionError,
    router: shell.router,
    sessionAccessToken: shell.session?.accessToken ?? undefined,
    setActionBusy: shell.setActionBusy,
    setMessage: shell.setMessage,
    showToast: shell.showToast,
  });

  return (
    <AuditView
      auditActionFilter={audit.auditActionFilter}
      auditColumns={audit.auditColumns}
      auditEvents={audit.auditEvents}
      auditPage={audit.auditPage}
      auditPageCount={audit.auditPageCount}
      auditQuery={audit.auditQuery}
      auditReport={audit.auditReport}
      auditResourceTypeFilter={audit.auditResourceTypeFilter}
      auditTotal={audit.auditTotal}
      handleAuditExport={audit.handleAuditExport}
      loadingWorkspace={audit.loadingAudit}
      setAuditActionFilter={audit.setAuditActionFilter}
      setAuditPage={audit.setAuditPage}
      setAuditQuery={audit.setAuditQuery}
      setAuditResourceTypeFilter={audit.setAuditResourceTypeFilter}
    />
  );
}
