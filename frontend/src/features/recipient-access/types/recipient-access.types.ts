import type { SecretType } from "@/features/secrets/types/secrets.types";
import type {
  ContractPermission,
  ShareLinkStatus,
} from "@/features/share-links/types/share-links.types";

export type PublicShareSourceType = "ORGANIZATION" | "ANONYMOUS";

export type PublicShareLinkMetadataResponse = {
  senderName: string;
  organizationName?: string | null;
  secretName: string;
  secretType: SecretType;
  recipientLabel?: string | null;
  permission: ContractPermission;
  status: ShareLinkStatus;
  expiresAt?: string | null;
  canReveal: boolean;
  sourceType: PublicShareSourceType;
};

export type ConsumeShareLinkResponse = {
  shareLinkId: string;
  secretName: string;
  secretKey: string;
  secretType: SecretType;
  versionNumber: number;
  value: string;
  permission: ContractPermission;
  status: ShareLinkStatus;
  sourceType: PublicShareSourceType;
};

export type CreatePublicSecretShareResponse = {
  id: string;
  shareToken: string;
  manageToken: string;
  accessPath: string;
  metadataPath: string;
  consumePath: string;
  managePath: string;
  expiresAt: string;
};

export type RevokePublicSecretShareResponse = {
  id: string;
  status: ShareLinkStatus;
  expiresAt: string;
  consumedAt?: string | null;
};

export type PublicSecretShareManagementResponse = {
  id: string;
  senderName: string;
  secretName: string;
  secretKey: string;
  status: ShareLinkStatus;
  expiresAt: string;
  consumedAt?: string | null;
  canRevoke: boolean;
};
