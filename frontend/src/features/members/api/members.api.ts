"use client";

import { authenticatedApiRequest } from "@/features/auth/lib/auth-storage";
import type { PageResponse } from "@/lib/api/types";
import type {
  InviteSummary,
  MemberSummary,
} from "@/features/members/types/members.types";

export async function fetchMembers(accessToken: string) {
  const page = await fetchMembersPage(accessToken, { page: 0, size: 100 });
  return page.items;
}

export async function fetchInvites(accessToken: string) {
  const page = await fetchInvitesPage(accessToken, { page: 0, size: 100 });
  return page.items;
}

export async function fetchMembersPage(
  accessToken: string,
  params: {
    page?: number;
    size?: number;
    query?: string;
    role?: string;
  },
) {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.query) searchParams.set("query", params.query);
  if (params.role) searchParams.set("role", params.role);
  return authenticatedApiRequest<PageResponse<MemberSummary>>(
    `/api/organization/members?${searchParams.toString()}`,
    accessToken,
  );
}

export async function fetchInvitesPage(
  accessToken: string,
  params: {
    page?: number;
    size?: number;
    query?: string;
    role?: string;
    status?: string;
  },
) {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.query) searchParams.set("query", params.query);
  if (params.role) searchParams.set("role", params.role);
  if (params.status) searchParams.set("status", params.status);
  return authenticatedApiRequest<PageResponse<InviteSummary>>(
    `/api/organization/invites?${searchParams.toString()}`,
    accessToken,
  );
}

export async function createInvite(
  accessToken: string,
  payload: { email: string; role: string },
) {
  return authenticatedApiRequest<InviteSummary>(
    "/api/organization/invites",
    accessToken,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function updateMemberRole(
  accessToken: string,
  memberId: string,
  role: string,
) {
  return authenticatedApiRequest<MemberSummary>(
    `/api/organization/members/${memberId}/role`,
    accessToken,
    { method: "PATCH", body: JSON.stringify({ role }) },
  );
}

export async function removeMember(accessToken: string, memberId: string) {
  return authenticatedApiRequest<void>(
    `/api/organization/members/${memberId}`,
    accessToken,
    { method: "DELETE" },
  );
}

export async function revokeInvite(accessToken: string, inviteId: string) {
  return authenticatedApiRequest<InviteSummary>(
    `/api/organization/invites/${inviteId}/revoke`,
    accessToken,
    { method: "POST" },
  );
}

export async function resendInvite(accessToken: string, inviteId: string) {
  return authenticatedApiRequest<InviteSummary>(
    `/api/organization/invites/${inviteId}/resend`,
    accessToken,
    { method: "POST" },
  );
}
