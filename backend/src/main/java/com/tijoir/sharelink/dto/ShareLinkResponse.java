package com.tijoir.sharelink.dto;

import com.tijoir.contract.ContractPermission;
import com.tijoir.secret.SecretType;
import com.tijoir.sharelink.ShareLinkStatus;

import java.time.Instant;
import java.util.UUID;

public record ShareLinkResponse(
        UUID id,
        UUID secretId,
        String secretName,
        String secretKey,
        SecretType secretType,
        UUID vendorId,
        String vendorName,
        UUID contractId,
        UUID grantId,
        String recipientLabel,
        ContractPermission permission,
        ShareLinkStatus status,
        Instant expiresAt,
        Instant consumedAt,
        Instant createdAt,
        String shareToken,
        String publicMetadataPath,
        String publicConsumePath
) {
}
