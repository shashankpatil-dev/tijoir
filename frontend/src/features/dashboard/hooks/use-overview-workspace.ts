import { useEffect, useMemo } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import type { AuthResponse } from "@/features/auth/types/auth.types";
import { dashboardQueryKeys } from "@/features/dashboard/lib/query-keys";
import { fetchInvitesPage, fetchMembersPage } from "@/features/members/api/members.api";
import { fetchSecretsPage } from "@/features/secrets/api/secrets.api";
import { fetchShareLinksPage } from "@/features/share-links/api/share-links.api";
import { fetchVendorsPage } from "@/features/vendors/api/vendors.api";

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

  const [secretSummaryQuery, activeShareLinksQuery, vendorSummaryQuery, memberSummaryQuery, inviteSummaryQuery] =
    useQueries({
      queries: [
        {
          queryKey: dashboardQueryKeys.secretsPage(accessToken, {
            page: 0,
            size: 1,
            query: "",
            type: "ALL",
            status: "ALL",
          }),
          queryFn: () => fetchSecretsPage(accessToken as string, { page: 0, size: 1 }),
          enabled: Boolean(accessToken),
        },
        {
          queryKey: dashboardQueryKeys.shareLinksPage(accessToken, {
            page: 0,
            size: 1,
            query: "",
            permission: "ALL",
            status: "ACTIVE",
          }),
          queryFn: () =>
            fetchShareLinksPage(accessToken as string, {
              page: 0,
              size: 1,
              status: "ACTIVE",
            }),
          enabled: Boolean(accessToken),
        },
        {
          queryKey: dashboardQueryKeys.vendorsPage(accessToken, {
            page: 0,
            size: 1,
            query: "",
            status: "ALL",
          }),
          queryFn: () => fetchVendorsPage(accessToken as string, { page: 0, size: 1 }),
          enabled: Boolean(accessToken),
        },
        {
          queryKey: dashboardQueryKeys.membersPage(accessToken, {
            page: 0,
            size: 1,
            query: "",
            role: "ALL",
          }),
          queryFn: () => fetchMembersPage(accessToken as string, { page: 0, size: 1 }),
          enabled: Boolean(accessToken && isOrganizationManager),
        },
        {
          queryKey: dashboardQueryKeys.invitesPage(accessToken, {
            page: 0,
            size: 1,
            query: "",
            role: "ALL",
            status: "PENDING",
          }),
          queryFn: () =>
            fetchInvitesPage(accessToken as string, {
              page: 0,
              size: 1,
              status: "PENDING",
            }),
          enabled: Boolean(accessToken && isOrganizationManager),
        },
      ],
    });

  useEffect(() => {
    const firstError =
      secretSummaryQuery.error ||
      activeShareLinksQuery.error ||
      vendorSummaryQuery.error ||
      memberSummaryQuery.error ||
      inviteSummaryQuery.error;

    if (firstError) {
      handleSessionError(firstError, "Could not load overview summary");
    }
  }, [
    activeShareLinksQuery.error,
    handleSessionError,
    inviteSummaryQuery.error,
    memberSummaryQuery.error,
    secretSummaryQuery.error,
    vendorSummaryQuery.error,
  ]);

  const loadingOverview = [
    secretSummaryQuery,
    activeShareLinksQuery,
    vendorSummaryQuery,
    memberSummaryQuery,
    inviteSummaryQuery,
  ].some((query) => query.isLoading);

  const activeSecret = useMemo(
    () => secretSummaryQuery.data?.items?.[0] ?? null,
    [secretSummaryQuery.data],
  );

  async function refreshOverview() {
    if (!accessToken) {
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "secrets-page", accessToken],
      }),
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "share-links-page", accessToken],
      }),
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "vendors-page", accessToken],
      }),
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "members-page", accessToken],
      }),
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "invites-page", accessToken],
      }),
    ]);
  }

  return {
    activeSecret,
    activeShareLinks: activeShareLinksQuery.data?.totalElements ?? 0,
    loadingOverview,
    memberCount: memberSummaryQuery.data?.totalElements ?? 0,
    pendingInvites: inviteSummaryQuery.data?.totalElements ?? 0,
    refreshOverview,
    secretCount: secretSummaryQuery.data?.totalElements ?? 0,
    vendorCount: vendorSummaryQuery.data?.totalElements ?? 0,
  };
}
