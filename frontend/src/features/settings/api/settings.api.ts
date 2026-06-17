"use client";

import { authenticatedApiRequest } from "@/features/auth/lib/auth-storage";
import type { OrganizationPolicyResponse } from "@/features/settings/types/settings.types";

export async function fetchOrganizationPolicy(accessToken: string) {
  return authenticatedApiRequest<OrganizationPolicyResponse>(
    "/api/organization/policy",
    accessToken,
  );
}

export async function updateOrganizationPolicy(
  accessToken: string,
  payload: {
    defaultShareLinkExpiryHours?: number | null;
    requireVendorContractForShareLinks: boolean;
    allowViewOnce: boolean;
    allowViewUntilRevoked: boolean;
    allowRotationNotifyOnly: boolean;
    rotationReminderDays?: number | null;
  },
) {
  return authenticatedApiRequest<OrganizationPolicyResponse>(
    "/api/organization/policy",
    accessToken,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}
