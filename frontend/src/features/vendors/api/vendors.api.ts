"use client";

import { authenticatedApiRequest } from "@/features/auth/lib/auth-storage";
import type { ContractPermission } from "@/features/share-links/types/share-links.types";
import type { PageResponse } from "@/lib/api/types";
import type {
  OffboardVendorResponse,
  VendorContractResponse,
  VendorContractStatus,
  VendorResponse,
  VendorStatus,
} from "@/features/vendors/types/vendors.types";

export async function fetchVendors(accessToken: string) {
  const page = await fetchVendorsPage(accessToken, { page: 0, size: 100 });
  return page.items;
}

export async function fetchVendorsPage(
  accessToken: string,
  params: {
    page?: number;
    size?: number;
    query?: string;
    status?: VendorStatus;
  },
) {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.query) searchParams.set("query", params.query);
  if (params.status) searchParams.set("status", params.status);
  return authenticatedApiRequest<PageResponse<VendorResponse>>(
    `/api/vendors?${searchParams.toString()}`,
    accessToken,
  );
}

export async function createVendor(
  accessToken: string,
  payload: {
    name: string;
    contactName?: string | null;
    contactEmail?: string | null;
    notes?: string | null;
  },
) {
  return authenticatedApiRequest<VendorResponse>("/api/vendors", accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchVendorContractsPage(
  accessToken: string,
  vendorId: string,
  params: {
    page?: number;
    size?: number;
    status?: VendorContractStatus;
  },
) {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.status) searchParams.set("status", params.status);
  return authenticatedApiRequest<PageResponse<VendorContractResponse>>(
    `/api/vendors/${vendorId}/contracts?${searchParams.toString()}`,
    accessToken,
  );
}

export async function createVendorContract(
  accessToken: string,
  vendorId: string,
  payload: {
    secretId: string;
    permission: ContractPermission;
    expiresAt?: string | null;
  },
) {
  return authenticatedApiRequest<VendorContractResponse>(
    `/api/vendors/${vendorId}/contracts`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function revokeVendorContract(
  accessToken: string,
  vendorId: string,
  contractId: string,
) {
  return authenticatedApiRequest<VendorContractResponse>(
    `/api/vendors/${vendorId}/contracts/${contractId}/revoke`,
    accessToken,
    { method: "POST" },
  );
}

export async function offboardVendor(accessToken: string, vendorId: string) {
  return authenticatedApiRequest<OffboardVendorResponse>(
    `/api/vendors/${vendorId}/offboard`,
    accessToken,
    { method: "POST" },
  );
}
