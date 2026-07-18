package com.tijoir.sharelink.dto;

import com.tijoir.sharelink.ShareLinkStatus;

import java.time.Instant;
import java.util.UUID;

public record PublicSecretShareManagementResponse(
        UUID id,
        String senderName,
        String secretName,
        String secretKey,
        ShareLinkStatus status,
        Instant expiresAt,
        Instant consumedAt,
        boolean canRevoke
) {
}
