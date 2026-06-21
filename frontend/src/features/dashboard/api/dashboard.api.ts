"use client";

import { authenticatedApiRequest } from "@/features/auth/lib/auth-storage";
import type { DashboardSummaryResponse } from "@/features/dashboard/types/dashboard.types";

export async function fetchDashboardSummary(accessToken: string) {
  return authenticatedApiRequest<DashboardSummaryResponse>(
    "/api/dashboard/summary",
    accessToken,
  );
}
