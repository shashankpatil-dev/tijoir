export const dashboardQueryKeys = {
  me: (accessToken?: string) => ["dashboard", "me", accessToken] as const,
  dashboardSummary: (accessToken?: string) =>
    ["dashboard", "summary", accessToken] as const,
  secrets: (accessToken?: string) => ["dashboard", "secrets", accessToken] as const,
  secretsPage: (
    accessToken: string | undefined,
    params: { page: number; size: number; query: string; type: string; status: string },
  ) => ["dashboard", "secrets-page", accessToken, params] as const,
  secretOptions: (accessToken?: string) => ["dashboard", "secret-options", accessToken] as const,
  secretDetail: (accessToken?: string, secretId?: string) =>
    ["dashboard", "secret-detail", accessToken, secretId] as const,
  shareLinks: (accessToken?: string) => ["dashboard", "share-links", accessToken] as const,
  shareLinksPage: (
    accessToken: string | undefined,
    params: { page: number; size: number; query: string; permission: string; status: string },
  ) => ["dashboard", "share-links-page", accessToken, params] as const,
  vendors: (accessToken?: string) => ["dashboard", "vendors", accessToken] as const,
  vendorsPage: (
    accessToken: string | undefined,
    params: { page: number; size: number; query: string; status: string },
  ) => ["dashboard", "vendors-page", accessToken, params] as const,
  vendorContractsPage: (
    accessToken: string | undefined,
    vendorId: string | undefined,
    params: { page: number; size: number; status: string },
  ) => ["dashboard", "vendor-contracts-page", accessToken, vendorId, params] as const,
  auditEventsPage: (
    accessToken: string | undefined,
    params: { page: number; size: number; query: string; action: string; resourceType: string },
  ) => ["dashboard", "audit-events-page", accessToken, params] as const,
  auditReport: (
    accessToken: string | undefined,
    params: { query: string; action: string; resourceType: string },
  ) => ["dashboard", "audit-report", accessToken, params] as const,
  members: (accessToken?: string) => ["dashboard", "members", accessToken] as const,
  membersPage: (
    accessToken: string | undefined,
    params: { page: number; size: number; query: string; role: string },
  ) => ["dashboard", "members-page", accessToken, params] as const,
  invites: (accessToken?: string) => ["dashboard", "invites", accessToken] as const,
  invitesPage: (
    accessToken: string | undefined,
    params: { page: number; size: number; query: string; role: string; status: string },
  ) => ["dashboard", "invites-page", accessToken, params] as const,
  organizationPolicy: (accessToken?: string) =>
    ["dashboard", "organization-policy", accessToken] as const,
} as const;
