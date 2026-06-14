package com.tijoir.secret.dto;

import com.tijoir.secret.SecretStatus;
import com.tijoir.secret.SecretType;

import java.time.Instant;
import java.util.UUID;

public record SecretSummaryResponse(
        UUID id,
        String name,
        String secretKey,
        SecretType type,
        SecretStatus status,
        int currentVersionNumber,
        Instant createdAt
) {
}
