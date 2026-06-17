"use client";

import { authenticatedApiRequest } from "@/features/auth/lib/auth-storage";
import type { PageResponse } from "@/lib/api/types";
import { apiUrl } from "@/lib/api/client";
import type {
  AuditAction,
  AuditEventResponse,
  AuditReportResponse,
} from "@/features/audit/types/audit.types";

export async function fetchAuditEventsPage(
  accessToken: string,
  params: {
    page?: number;
    size?: number;
    query?: string;
    action?: AuditAction;
    resourceType?: string;
  },
) {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.query) searchParams.set("query", params.query);
  if (params.action) searchParams.set("action", params.action);
  if (params.resourceType) searchParams.set("resourceType", params.resourceType);
  return authenticatedApiRequest<PageResponse<AuditEventResponse>>(
    `/api/audit-events?${searchParams.toString()}`,
    accessToken,
  );
}

export async function fetchAuditReport(
  accessToken: string,
  params: {
    query?: string;
    action?: AuditAction;
    resourceType?: string;
  },
) {
  const searchParams = new URLSearchParams();
  if (params.query) searchParams.set("query", params.query);
  if (params.action) searchParams.set("action", params.action);
  if (params.resourceType) searchParams.set("resourceType", params.resourceType);
  return authenticatedApiRequest<AuditReportResponse>(
    `/api/audit-events/report?${searchParams.toString()}`,
    accessToken,
  );
}

export async function exportAuditCsv(
  accessToken: string,
  params: {
    query?: string;
    action?: AuditAction;
    resourceType?: string;
  },
) {
  const searchParams = new URLSearchParams();
  if (params.query) searchParams.set("query", params.query);
  if (params.action) searchParams.set("action", params.action);
  if (params.resourceType) searchParams.set("resourceType", params.resourceType);
  const response = await fetch(apiUrl(`/api/audit-events/export?${searchParams.toString()}`), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Could not export audit csv");
  }
  return response.text();
}
