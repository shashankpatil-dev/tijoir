package com.tijoir.auth.dto;

import java.time.Instant;

public record AuthResponse(
        String accessToken,
        String tokenType,
        Instant expiresAt,
        UserSummary user,
        OrganizationSummary organization
) {
}

