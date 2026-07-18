import type { ContractPermission } from "@/features/share-links/types/share-links.types";
import type { SecretType } from "@/features/secrets/types/secrets.types";

export type VendorStatus = "ACTIVE" | "OFFBOARDED";

export type VendorResponse = {
  id: string;
  name: string;
  contactName?: string | null;
  contactEmail?: string | null;
  notes?: string | null;
  status: VendorStatus;
  createdByName: string;
  offboardedAt?: string | null;
  createdAt: string;
};

export type VendorContractStatus = "ACTIVE" | "REVOKED" | "EXPIRED";

export type VendorContractResponse = {
  id: string;
  vendorId: string;
  vendorName: string;
  permission: ContractPermission;
  grantCount: number;
  status: VendorContractStatus;
  expiresAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
};

export type VendorContractGrantStatus = "ACTIVE" | "REVOKED" | "EXPIRED";

export type VendorContractGrantResponse = {
  id: string;
  contractId: string;
  vendorId: string;
  vendorName: string;
  secretId: string;
  secretName: string;
  secretKey: string;
  secretType: SecretType;
  permission: ContractPermission;
  status: VendorContractGrantStatus;
  expiresAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
};

export type OffboardVendorResponse = {
  vendorId: string;
  vendorName: string;
  revokedContracts: number;
  revokedShareLinks: number;
  offboarded: boolean;
};
