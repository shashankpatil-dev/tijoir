import type { QueryClient } from "@tanstack/react-query";
import { DASHBOARD_ITEMS_PER_PAGE } from "@/features/dashboard/lib/dashboard-pagination";
import { dashboardQueryKeys } from "@/features/dashboard/lib/query-keys";

export function buildShareLinksPageParams({
  page,
  query,
  permission,
  status,
}: {
  page: number;
  query: string;
  permission: string;
  status: string;
}) {
  return {
    page: page - 1,
    size: DASHBOARD_ITEMS_PER_PAGE,
    query,
    permission,
    status,
  };
}

export async function invalidateShareLinksQueries({
  accessToken,
  page,
  permission,
  query,
  queryClient,
  status,
}: {
  accessToken: string;
  page: number;
  permission: string;
  query: string;
  queryClient: QueryClient;
  status: string;
}) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.shareLinks(accessToken),
    }),
    queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.shareLinksPage(
        accessToken,
        buildShareLinksPageParams({ page, query, permission, status }),
      ),
    }),
  ]);
}
