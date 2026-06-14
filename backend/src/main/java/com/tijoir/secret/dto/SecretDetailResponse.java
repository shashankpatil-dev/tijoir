package com.tijoir.secret.dto;

import com.tijoir.secret.SecretStatus;
import com.tijoir.secret.SecretType;

import java.time.Instant;
import java.util.UUID;

public record SecretDetailResponse(
        UUID id,
        String name,
        String secretKey,
        SecretType type,
        String description,
        SecretStatus status,
        int currentVersionNumber,
        String createdByName,
        String createdByEmail,
        Instant createdAt
) {
}
