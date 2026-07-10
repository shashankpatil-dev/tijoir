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
  };
  organization: {
    name: string;
    slug: string;
    email: string;
  };
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
