import type { SecretType } from "@/features/secrets/types/secrets.types";
import type {
  ContractPermission,
  ShareLinkStatus,
} from "@/features/share-links/types/share-links.types";

export type PublicShareLinkMetadataResponse = {
  organizationName: string;
  secretName: string;
  secretType: SecretType;
  recipientLabel?: string | null;
  permission: ContractPermission;
  status: ShareLinkStatus;
  expiresAt?: string | null;
  canReveal: boolean;
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
};
