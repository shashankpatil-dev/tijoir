export { ApiRequestError, type ApiError } from "@/lib/api/errors";
export { apiBaseUrl, apiRequest, apiUrl } from "@/lib/api/client";

export type {
  AuthResponse,
  PendingVerification,
  RegisterResponse,
} from "@/features/auth/types/auth.types";
export {
  clearPendingVerification,
  clearSession,
  consumeRedirectPath,
  authenticatedApiRequest,
  readPendingVerification,
  readRememberedEmail,
  readSession,
  refreshSession,
  savePendingVerification,
  saveRedirectPath,
  saveSession,
} from "@/features/auth/lib/auth-storage";

export type {
  GeneratedSecretResponse,
  RevealSecretResponse,
  SecretDetail,
  SecretStatus,
  SecretSummary,
  SecretType,
} from "@/features/secrets/types/secrets.types";

export type {
  ContractPermission,
  ShareLinkResponse,
  ShareLinkStatus,
} from "@/features/share-links/types/share-links.types";

export type {
  InviteStatus,
  InviteSummary,
  MemberSummary,
} from "@/features/members/types/members.types";

export type {
  ConsumeShareLinkResponse,
  PublicShareLinkMetadataResponse,
} from "@/features/recipient-access/types/recipient-access.types";

export { readWorkspaceCache, saveWorkspaceCache, type WorkspaceCache } from "@/features/dashboard/lib/workspace-cache";
export { readLastPublicToken, saveLastPublicToken } from "@/features/recipient-access/api/recipient-access.api";

export function buildStaticAppUrl(path: string, params?: Record<string, string>): string {
  const pathname = path === "/" ? "/" : `${path}.html`;
  if (typeof window === "undefined") {
    return pathname;
  }

  const url = new URL(pathname, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return url.toString();
}
