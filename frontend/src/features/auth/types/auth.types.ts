export type AuthResponse = {
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenType?: string | null;
  expiresAt?: string | null;
  refreshExpiresAt?: string | null;
  user: {
    id: string;
    identityUserId: string;
    organizationId: string;
    name: string;
    email: string;
    role: string;
    emailVerified: boolean;
    createdAt?: string | null;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    email: string;
  };
  memberships: WorkspaceMembershipSummary[];
};

export type WorkspaceMembershipSummary = {
  organizationId: string;
  userId: string;
  organizationName: string;
  organizationSlug: string;
  organizationEmail: string;
  role: string;
  active: boolean;
  joinedAt?: string | null;
};

export type RegisterResponse = {
  verificationRequired?: boolean;
  verificationEmailRequested?: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiresAt?: string;
};

export type PendingVerification = {
  token?: string;
  email: string;
  expiresAt?: string;
};

export type InviteResolutionResponse = {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  invitedEmail: string;
  role: string;
  status: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
  expiresAt: string;
  existingAccount: boolean;
};

export type GoogleExchangeResponse = {
  needsOrganization: boolean;
  session: AuthResponse | null;
};
