package com.tijoir.secret.dto;

import java.time.Instant;

public record SecretVersionResponse(
        int versionNumber,
        boolean current,
        String createdByName,
        String createdByEmail,
        Instant createdAt
) {
}
