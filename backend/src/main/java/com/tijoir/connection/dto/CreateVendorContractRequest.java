package com.tijoir.connection.dto;

import com.tijoir.contract.ContractPermission;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.UUID;

public record CreateVendorContractRequest(
        @NotNull UUID secretId,
        @NotNull ContractPermission permission,
        Instant expiresAt
) {
}
