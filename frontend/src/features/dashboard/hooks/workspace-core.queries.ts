import { currentUserRequest } from "@/features/auth/api/auth.api";
import { dashboardQueryKeys } from "@/features/dashboard/lib/query-keys";
import { fetchInvites, fetchMembers } from "@/features/members/api/members.api";
import { fetchSecrets } from "@/features/secrets/api/secrets.api";
import { fetchShareLinks } from "@/features/share-links/api/share-links.api";
import { fetchVendors } from "@/features/vendors/api/vendors.api";

export function buildWorkspaceQueries(accessToken?: string) {
  return [
    {
      queryKey: dashboardQueryKeys.me(accessToken),
      queryFn: () => currentUserRequest(accessToken as string),
      enabled: Boolean(accessToken),
    },
    {
      queryKey: dashboardQueryKeys.secrets(accessToken),
      queryFn: () => fetchSecrets(accessToken as string),
      enabled: Boolean(accessToken),
    },
    {
      queryKey: dashboardQueryKeys.vendors(accessToken),
      queryFn: () => fetchVendors(accessToken as string),
      enabled: Boolean(accessToken),
    },
    {
      queryKey: dashboardQueryKeys.shareLinks(accessToken),
      queryFn: () => fetchShareLinks(accessToken as string),
      enabled: Boolean(accessToken),
    },
    {
      queryKey: dashboardQueryKeys.members(accessToken),
      queryFn: () => fetchMembers(accessToken as string),
      enabled: Boolean(accessToken),
    },
    {
      queryKey: dashboardQueryKeys.invites(accessToken),
      queryFn: () => fetchInvites(accessToken as string),
      enabled: Boolean(accessToken),
    },
  ] as const;
}
