"use client";

import type { InviteSummary, MemberSummary } from "@/features/members/types/members.types";
import type { SecretSummary } from "@/features/secrets/types/secrets.types";
import type { ShareLinkResponse } from "@/features/share-links/types/share-links.types";

export type WorkspaceCache = {
  secrets: SecretSummary[];
  shareLinks: ShareLinkResponse[];
  members?: MemberSummary[];
  invites?: InviteSummary[];
  selectedSecretId?: string;
  activeView?: string;
  updatedAt: string;
};

const workspaceCachePrefix = "tijoir.workspaceCache.";

export function saveWorkspaceCache(
  organizationSlug: string,
  cache: WorkspaceCache,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    workspaceCachePrefix + organizationSlug,
    JSON.stringify(cache),
  );
}

export function readWorkspaceCache(
  organizationSlug: string,
): WorkspaceCache | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(workspaceCachePrefix + organizationSlug);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as WorkspaceCache;
  } catch {
    window.localStorage.removeItem(workspaceCachePrefix + organizationSlug);
    return null;
  }
}
