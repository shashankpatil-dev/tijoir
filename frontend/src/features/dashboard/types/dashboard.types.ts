import type { SecretSummary } from "@/features/secrets/types/secrets.types";

export type DashboardSummaryResponse = {
  secretCount: number;
  activeShareLinks: number;
  vendorCount: number;
  memberCount: number;
  pendingInvites: number;
  latestSecret?: SecretSummary | null;
};
