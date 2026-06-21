import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuthResponse } from "@/features/auth/types/auth.types";
import { fetchDashboardSummary } from "@/features/dashboard/api/dashboard.api";
import { dashboardQueryKeys } from "@/features/dashboard/lib/query-keys";

export function useOverviewWorkspace({
  handleSessionError,
  isOrganizationManager,
  session,
}: {
  handleSessionError: (error: unknown, fallback: string) => void;
  isOrganizationManager: boolean;
  session: AuthResponse | null;
}) {
  const queryClient = useQueryClient();
  const accessToken = session?.accessToken;

  const summaryQuery = useQuery({
    queryKey: dashboardQueryKeys.dashboardSummary(accessToken),
    queryFn: () => fetchDashboardSummary(accessToken as string),
    enabled: Boolean(accessToken),
  });

  useEffect(() => {
    if (summaryQuery.error) {
      handleSessionError(summaryQuery.error, "Could not load overview summary");
    }
  }, [handleSessionError, summaryQuery.error]);

  const loadingOverview = summaryQuery.isLoading;

  const activeSecret = useMemo(
    () => summaryQuery.data?.latestSecret ?? null,
    [summaryQuery.data],
  );

  async function refreshOverview() {
    if (!accessToken) {
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.dashboardSummary(accessToken),
      }),
    ]);
  }

  return {
    activeSecret,
    activeShareLinks: summaryQuery.data?.activeShareLinks ?? 0,
    loadingOverview,
    memberCount: isOrganizationManager ? summaryQuery.data?.memberCount ?? 0 : 0,
    pendingInvites: isOrganizationManager ? summaryQuery.data?.pendingInvites ?? 0 : 0,
    refreshOverview,
    secretCount: summaryQuery.data?.secretCount ?? 0,
    vendorCount: summaryQuery.data?.vendorCount ?? 0,
  };
}
