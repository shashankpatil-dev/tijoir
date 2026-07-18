package com.tijoir.connection.dto;

import com.tijoir.connection.VendorAccessContractStatus;
import com.tijoir.contract.ContractPermission;

import java.time.Instant;
import java.util.UUID;

public record IncomingVendorContractResponse(
        UUID id,
        UUID ownerOrganizationId,
        String ownerOrganizationName,
        String ownerOrganizationSlug,
        UUID vendorId,
        String vendorName,
        ContractPermission permission,
        int grantCount,
        VendorAccessContractStatus status,
        Instant expiresAt,
        Instant counterpartyAcceptedAt,
        Instant createdAt
) {
}
