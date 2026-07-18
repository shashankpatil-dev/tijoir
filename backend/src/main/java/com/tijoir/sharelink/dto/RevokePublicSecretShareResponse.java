package com.tijoir.sharelink.dto;

import com.tijoir.sharelink.ShareLinkStatus;

import java.time.Instant;
import java.util.UUID;

public record RevokePublicSecretShareResponse(
        UUID id,
        ShareLinkStatus status,
        Instant expiresAt,
        Instant consumedAt
) {
}
