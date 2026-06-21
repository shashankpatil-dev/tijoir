export type OrganizationPolicyResponse = {
  defaultShareLinkExpiryHours?: number | null;
  requireVendorContractForShareLinks: boolean;
  allowViewOnce: boolean;
  allowViewUntilRevoked: boolean;
  allowRotationNotifyOnly: boolean;
  rotationReminderDays?: number | null;
  updatedAt?: string | null;
};

export type MfaSecurityState = {
  challengeId: string;
  expiresAt: string;
  otpauthUri: string;
  secret: string;
};
