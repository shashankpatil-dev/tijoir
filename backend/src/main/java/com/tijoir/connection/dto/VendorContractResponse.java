package com.tijoir.connection.dto;

import com.tijoir.connection.VendorAccessContractStatus;
import com.tijoir.contract.ContractPermission;
import com.tijoir.secret.SecretType;

import java.time.Instant;
import java.util.UUID;

public record VendorContractResponse(
        UUID id,
        UUID vendorId,
        String vendorName,
        UUID secretId,
        String secretName,
        String secretKey,
        SecretType secretType,
        ContractPermission permission,
        VendorAccessContractStatus status,
        Instant expiresAt,
        Instant revokedAt,
        Instant createdAt
) {
}
