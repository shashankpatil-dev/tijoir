"use client";

import { authenticatedApiRequest } from "@/features/auth/lib/auth-storage";
import type { PageResponse } from "@/lib/api/types";
import type {
  InviteSummary,
  MemberSummary,
} from "@/features/members/types/members.types";

export async function fetchMembers(accessToken: string) {
  const page = await authenticatedApiRequest<PageResponse<MemberSummary>>(
    "/api/organization/members?page=0&size=100",
    accessToken,
  );
  return page.items;
}

export async function fetchInvites(accessToken: string) {
  const page = await authenticatedApiRequest<PageResponse<InviteSummary>>(
    "/api/organization/invites?page=0&size=100",
    accessToken,
  );
  return page.items;
}

export async function createInvite(
  accessToken: string,
  payload: { email: string; role: string },
) {
  return authenticatedApiRequest<InviteSummary>(
    "/api/organization/invites",
    accessToken,
    { method: "POST", body: JSON.stringify(payload) },
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
