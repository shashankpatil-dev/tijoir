package com.tijoir.sharelink.dto;

import com.tijoir.contract.ContractPermission;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public record CreateShareLinkRequest(
        @NotNull UUID secretId,
        @Size(max = 255) String recipientLabel,
        @NotNull ContractPermission permission,
        Instant expiresAt,
        UUID vendorId,
        UUID contractId
) {
}
