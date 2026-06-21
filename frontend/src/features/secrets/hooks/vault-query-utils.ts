import type { QueryClient } from "@tanstack/react-query";
import { DASHBOARD_ITEMS_PER_PAGE } from "@/features/dashboard/lib/dashboard-pagination";
import { dashboardQueryKeys } from "@/features/dashboard/lib/query-keys";

export async function invalidateVaultQueries({
  accessToken,
  page,
  queryClient,
  search,
  secretId,
  status,
  type,
}: {
  accessToken: string;
  page: number;
  queryClient: QueryClient;
  search: string;
  secretId?: string;
  status: string;
  type: string;
}) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.dashboardSummary(accessToken),
    }),
    queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.secrets(accessToken),
    }),
    queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.secretsPage(accessToken, {
        page: page - 1,
        size: DASHBOARD_ITEMS_PER_PAGE,
        query: search,
        type,
        status,
      }),
    }),
    ...(secretId
      ? [
          queryClient.invalidateQueries({
            queryKey: dashboardQueryKeys.secretDetail(accessToken, secretId),
          }),
        ]
      : []),
  ]);
}
