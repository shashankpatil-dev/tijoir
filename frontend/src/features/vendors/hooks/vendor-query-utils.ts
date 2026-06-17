import type { QueryClient } from "@tanstack/react-query";
import { DASHBOARD_ITEMS_PER_PAGE } from "@/features/dashboard/lib/dashboard-pagination";
import { dashboardQueryKeys } from "@/features/dashboard/lib/query-keys";

export async function invalidateVendorWorkspaceQueries({
  accessToken,
  contractPage,
  contractStatusFilter,
  queryClient,
  vendorId,
  vendorPage,
  vendorSearch,
  vendorStatusFilter,
}: {
  accessToken: string;
  contractPage: number;
  contractStatusFilter: string;
  queryClient: QueryClient;
  vendorId?: string;
  vendorPage: number;
  vendorSearch: string;
  vendorStatusFilter: string;
}) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.vendors(accessToken),
    }),
    queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.vendorsPage(accessToken, {
        page: vendorPage - 1,
        size: DASHBOARD_ITEMS_PER_PAGE,
        query: vendorSearch,
        status: vendorStatusFilter,
      }),
    }),
    queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.shareLinks(accessToken),
    }),
    ...(vendorId
      ? [
          queryClient.invalidateQueries({
            queryKey: dashboardQueryKeys.vendorContractsPage(accessToken, vendorId, {
              page: contractPage - 1,
              size: DASHBOARD_ITEMS_PER_PAGE,
              status: contractStatusFilter,
            }),
          }),
        ]
      : []),
  ]);
}
