import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { buildAuditColumns } from "@/features/dashboard/lib/dashboard-columns";
import { DASHBOARD_ITEMS_PER_PAGE, pageCount } from "@/features/dashboard/lib/dashboard-pagination";
import { dashboardQueryKeys } from "@/features/dashboard/lib/query-keys";
import type { RouterLike, ShowToast } from "@/features/dashboard/hooks/workspace.types";
import {
  exportAuditCsv,
  fetchAuditEventsPage,
  fetchAuditReport,
} from "@/features/audit/api/audit.api";
import type { AuditAction, AuditEventResponse } from "@/features/audit/types/audit.types";
import type { DataTableColumn } from "@/components/ui/data-table";

export function useAuditWorkspace({
  handleSessionError,
  router,
  sessionAccessToken,
  setActionBusy,
  setMessage,
  showToast,
}: {
  handleSessionError: (error: unknown, fallback: string) => void;
  router: RouterLike;
  sessionAccessToken?: string;
  setActionBusy: (value: string | null) => void;
  setMessage: (value: string) => void;
  showToast: ShowToast;
}) {
  const [auditQuery, setAuditQuery] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("ALL");
  const [auditResourceTypeFilter, setAuditResourceTypeFilter] = useState("ALL");
  const [auditPage, setAuditPage] = useState(1);

  useEffect(() => {
    setAuditPage(1);
  }, [auditActionFilter, auditQuery, auditResourceTypeFilter]);

  const auditPageQuery = useQuery({
    queryKey: dashboardQueryKeys.auditEventsPage(sessionAccessToken, {
      page: auditPage - 1,
      size: DASHBOARD_ITEMS_PER_PAGE,
      query: auditQuery,
      action: auditActionFilter,
      resourceType: auditResourceTypeFilter,
    }),
    queryFn: () =>
      fetchAuditEventsPage(sessionAccessToken as string, {
        page: auditPage - 1,
        size: DASHBOARD_ITEMS_PER_PAGE,
        query: auditQuery.trim() || undefined,
        action: auditActionFilter === "ALL" ? undefined : (auditActionFilter as AuditAction),
        resourceType:
          auditResourceTypeFilter === "ALL" ? undefined : auditResourceTypeFilter,
      }),
    enabled: Boolean(sessionAccessToken),
    placeholderData: (previous) => previous,
  });

  const auditReportQuery = useQuery({
    queryKey: dashboardQueryKeys.auditReport(sessionAccessToken, {
      query: auditQuery,
      action: auditActionFilter,
      resourceType: auditResourceTypeFilter,
    }),
    queryFn: () =>
      fetchAuditReport(sessionAccessToken as string, {
        query: auditQuery.trim() || undefined,
        action: auditActionFilter === "ALL" ? undefined : (auditActionFilter as AuditAction),
        resourceType:
          auditResourceTypeFilter === "ALL" ? undefined : auditResourceTypeFilter,
      }),
    enabled: Boolean(sessionAccessToken),
  });

  useEffect(() => {
    if (auditPageQuery.error) {
      handleSessionError(auditPageQuery.error, "Could not load audit events");
    }
  }, [auditPageQuery.error, handleSessionError]);

  useEffect(() => {
    if (auditReportQuery.error) {
      handleSessionError(auditReportQuery.error, "Could not load audit report");
    }
  }, [auditReportQuery.error, handleSessionError]);

  const auditEvents = auditPageQuery.data?.items ?? [];
  const auditPageCount =
    auditPageQuery.data?.totalPages ?? pageCount(auditEvents.length, DASHBOARD_ITEMS_PER_PAGE);
  const auditTotal = auditPageQuery.data?.totalElements ?? auditEvents.length;

  const auditColumns = useMemo<DataTableColumn<AuditEventResponse>[]>(
    () => buildAuditColumns(),
    [],
  );

  async function handleAuditExport() {
    if (!sessionAccessToken) {
      router.replace("/login");
      return;
    }

    setActionBusy("audit-export");
    setMessage("Exporting audit csv");
    try {
      const csv = await exportAuditCsv(sessionAccessToken, {
        query: auditQuery.trim() || undefined,
        action: auditActionFilter === "ALL" ? undefined : (auditActionFilter as AuditAction),
        resourceType:
          auditResourceTypeFilter === "ALL" ? undefined : auditResourceTypeFilter,
      });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = "tijoir-audit-export.csv";
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      showToast({
        title: "Export ready",
        description: "Audit CSV has been downloaded.",
        tone: "success",
      });
      setMessage("Audit csv exported.");
    } catch (error) {
      handleSessionError(error, "Could not export audit csv");
    } finally {
      setActionBusy(null);
    }
  }

  return {
    auditActionFilter,
    auditColumns,
    auditEvents,
    auditPage,
    auditPageCount,
    auditQuery,
    auditReport: auditReportQuery.data ?? null,
    auditResourceTypeFilter,
    auditTotal,
    handleAuditExport,
    setAuditActionFilter,
    setAuditPage,
    setAuditQuery,
    setAuditResourceTypeFilter,
  };
}
