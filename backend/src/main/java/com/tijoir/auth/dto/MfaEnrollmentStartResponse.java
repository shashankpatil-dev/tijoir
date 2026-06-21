package com.tijoir.auth.dto;

import java.time.Instant;

public record MfaEnrollmentStartResponse(
        String challengeId,
        String secret,
        String otpauthUri,
        Instant expiresAt
) {
}
