export type AuthResponse = {
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenType?: string | null;
  expiresAt?: string | null;
  refreshExpiresAt?: string | null;
  user: {
    name: string;
    email: string;
    role: string;
    emailVerified: boolean;
    mfaEnabled?: boolean;
  };
  organization: {
    name: string;
    slug: string;
    email: string;
  };
  mfaRequired?: boolean | null;
  mfaChallengeId?: string | null;
  mfaChallengeExpiresAt?: string | null;
};

export type RegisterResponse = {
  emailVerificationToken?: string;
  emailVerificationExpiresAt?: string;
};

export type PendingVerification = {
  token: string;
  email: string;
  expiresAt?: string;
};

export type MfaStatusResponse = {
  enabled: boolean;
  enrolledAt?: string | null;
};

export type MfaEnrollmentStartResponse = {
  challengeId: string;
  secret: string;
  otpauthUri: string;
  expiresAt: string;
};
