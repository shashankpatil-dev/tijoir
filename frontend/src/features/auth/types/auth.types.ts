export type AuthResponse = {
  accessToken: string;
  refreshToken?: string | null;
  tokenType: string;
  expiresAt: string;
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
  emailVerificationToken?: string;
  emailVerificationExpiresAt?: string;
};

export type PendingVerification = {
  token: string;
  email: string;
  expiresAt?: string;
};
