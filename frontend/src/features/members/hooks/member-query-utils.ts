import type { QueryClient } from "@tanstack/react-query";
import { DASHBOARD_ITEMS_PER_PAGE } from "@/features/dashboard/lib/dashboard-pagination";
import { dashboardQueryKeys } from "@/features/dashboard/lib/query-keys";

export function buildMembersPageParams({
  page,
  query,
  role,
}: {
  page: number;
  query: string;
  role: string;
}) {
  return {
    page: page - 1,
    size: DASHBOARD_ITEMS_PER_PAGE,
    query,
    role,
  };
}

export function buildInvitesPageParams({
  page,
  query,
  status,
}: {
  page: number;
  query: string;
  status: string;
}) {
  return {
    page: page - 1,
    size: DASHBOARD_ITEMS_PER_PAGE,
    query,
    role: "ALL",
    status,
  };
}

export async function invalidateMembersQueries({
  accessToken,
  page,
  query,
  queryClient,
  role,
}: {
  accessToken: string;
  page: number;
  query: string;
  queryClient: QueryClient;
  role: string;
}) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.members(accessToken),
    }),
    queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.membersPage(
        accessToken,
        buildMembersPageParams({ page, query, role }),
      ),
    }),
  ]);
}

export async function invalidateInvitesQueries({
  accessToken,
  page,
  query,
  queryClient,
  status,
}: {
  accessToken: string;
  page: number;
  query: string;
  queryClient: QueryClient;
  status: string;
}) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.invites(accessToken),
    }),
    queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.invitesPage(
        accessToken,
        buildInvitesPageParams({ page, query, status }),
      ),
    }),
  ]);
}
