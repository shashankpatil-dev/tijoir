package com.tijoir.sharelink.dto;

import com.tijoir.contract.ContractPermission;
import com.tijoir.secret.SecretType;
import com.tijoir.sharelink.ShareLinkStatus;

import java.time.Instant;

public record PublicShareLinkMetadataResponse(
        String organizationName,
        String secretName,
        SecretType secretType,
        String recipientLabel,
        ContractPermission permission,
        ShareLinkStatus status,
        Instant expiresAt,
        boolean canReveal
) {
}
