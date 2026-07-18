package com.tijoir.connection.dto;

import com.tijoir.connection.VendorContractGrantStatus;
import com.tijoir.contract.ContractPermission;
import com.tijoir.secret.SecretType;

import java.time.Instant;
import java.util.UUID;

public record RevealVendorContractGrantResponse(
        UUID grantId,
        UUID contractId,
        UUID secretId,
        String secretName,
        String secretKey,
        SecretType secretType,
        ContractPermission permission,
        VendorContractGrantStatus status,
        int versionNumber,
        String value,
        Instant consumedAt
) {
}
