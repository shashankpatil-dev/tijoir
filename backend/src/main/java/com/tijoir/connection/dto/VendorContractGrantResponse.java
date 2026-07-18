package com.tijoir.connection.dto;

import com.tijoir.connection.VendorContractGrantStatus;
import com.tijoir.contract.ContractPermission;
import com.tijoir.secret.SecretType;

import java.time.Instant;
import java.util.UUID;

public record VendorContractGrantResponse(
        UUID id,
        UUID contractId,
        UUID vendorId,
        String vendorName,
        UUID secretId,
        String secretName,
        String secretKey,
        SecretType secretType,
        ContractPermission permission,
        VendorContractGrantStatus status,
        Instant expiresAt,
        Instant revokedAt,
        Instant createdAt
) {
}
