import type { DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import type { AuthResponse } from "@/features/auth/types/auth.types";
import type { InviteSummary, MemberSummary } from "@/features/members/types/members.types";
import type { SecretSummary } from "@/features/secrets/types/secrets.types";
import type { ShareLinkResponse } from "@/features/share-links/types/share-links.types";
import type { VendorResponse } from "@/features/vendors/types/vendors.types";
import { readWorkspaceCache } from "@/features/dashboard/lib/workspace-cache";

export type CachedWorkspaceState = {
  secrets: SecretSummary[];
  shareLinks: ShareLinkResponse[];
  vendors: VendorResponse[];
  members: MemberSummary[];
  invites: InviteSummary[];
};

export const EMPTY_WORKSPACE_STATE: CachedWorkspaceState = {
  secrets: [],
  shareLinks: [],
  vendors: [],
  members: [],
  invites: [],
};

export function getCachedWorkspaceState(initialSession: AuthResponse): {
  cachedWorkspace: CachedWorkspaceState;
  selectedSecretId: string;
} {
  const cached = readWorkspaceCache(initialSession.organization.slug);
  if (!cached) {
    return {
      cachedWorkspace: EMPTY_WORKSPACE_STATE,
      selectedSecretId: "",
    };
  }

  return {
    cachedWorkspace: {
      secrets: cached.secrets,
      shareLinks: cached.shareLinks,
      vendors: cached.vendors || [],
      members: cached.members || [],
      invites: cached.invites || [],
    },
    selectedSecretId: cached.selectedSecretId || "",
  };
}

export function hasOrganizationManagerRole(role?: string) {
  return role === "ORG_OWNER" || role === "ADMIN";
}

export function canRoleReviewAudit(role?: string) {
  return role === "ORG_OWNER" || role === "ADMIN" || role === "AUDITOR";
}

export function buildNavigationItems({
  activeShareLinks,
  canReviewAudit,
  isOrganizationManager,
  membersCount,
  secretsCount,
  vendorsCount,
}: {
  activeShareLinks: number;
  canReviewAudit: boolean;
  isOrganizationManager: boolean;
  membersCount: number;
  secretsCount: number;
  vendorsCount: number;
}): DashboardNavItem[] {
  const items: DashboardNavItem[] = [
    { id: "overview", label: "Overview", note: "Workspace status" },
    {
      id: "vault",
      label: "Vault",
      note: "Secrets and rotation",
      badge: String(secretsCount),
    },
    {
      id: "vendors",
      label: "Vendors",
      note: "Entities and contracts",
      badge: String(vendorsCount),
    },
    {
      id: "share",
      label: "Share Links",
      note: "Recipient access",
      badge: String(activeShareLinks),
    },
  ];

  if (isOrganizationManager) {
    items.push({
      id: "organization",
      label: "Organization",
      note: "Profile, team and access",
      badge: String(membersCount),
    });
  }

  if (canReviewAudit) {
    items.push({
      id: "audit",
      label: "Audit Log",
      note: "Security activity",
    });
  }

  if (isOrganizationManager) {
    items.push({
      id: "settings",
      label: "Settings",
      note: "Policy and controls",
    });
  }

  items.push({
    id: "recipient",
    label: "Recipient Access",
    note: "Open shared secrets",
  });

  return items;
}
