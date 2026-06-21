package com.tijoir.auth.dto;

import java.time.Instant;

public record MfaStatusResponse(
        boolean enabled,
        Instant enrolledAt
) {
}
