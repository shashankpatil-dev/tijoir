export const dashboardQueryKeys = {
  me: (accessToken?: string) => ["dashboard", "me", accessToken] as const,
  secrets: (accessToken?: string) => ["dashboard", "secrets", accessToken] as const,
  secretDetail: (accessToken?: string, secretId?: string) =>
    ["dashboard", "secret-detail", accessToken, secretId] as const,
  shareLinks: (accessToken?: string) => ["dashboard", "share-links", accessToken] as const,
  members: (accessToken?: string) => ["dashboard", "members", accessToken] as const,
  invites: (accessToken?: string) => ["dashboard", "invites", accessToken] as const,
} as const;
