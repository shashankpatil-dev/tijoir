package com.tijoir.sharelink.dto;

import java.time.Instant;
import java.util.UUID;

public record CreatePublicSecretShareResponse(
        UUID id,
        String shareToken,
        String manageToken,
        String accessPath,
        String metadataPath,
        String consumePath,
        String managePath,
        Instant expiresAt
) {
}
