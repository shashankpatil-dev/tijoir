import type { SecretType } from "@/features/secrets/types/secrets.types";

export type ContractPermission =
  | "VIEW_ONCE"
  | "VIEW_UNTIL_REVOKED"
  | "ROTATION_NOTIFY_ONLY";

export type ShareLinkStatus = "ACTIVE" | "REVOKED" | "CONSUMED" | "EXPIRED";

export type ShareLinkResponse = {
  id: string;
  secretId: string;
  secretName: string;
  secretKey: string;
  secretType: SecretType;
  vendorId?: string | null;
  vendorName?: string | null;
  contractId?: string | null;
  grantId?: string | null;
  recipientLabel?: string | null;
  permission: ContractPermission;
  status: ShareLinkStatus;
  expiresAt?: string | null;
  consumedAt?: string | null;
  createdAt: string;
  shareToken?: string | null;
  publicMetadataPath?: string | null;
  publicConsumePath?: string | null;
};

export const CONTRACT_PERMISSIONS: ContractPermission[] = [
  "VIEW_ONCE",
  "VIEW_UNTIL_REVOKED",
  "ROTATION_NOTIFY_ONLY",
];
