package com.tijoir.auth.security;

import com.tijoir.organization.UserRole;

import java.time.Instant;
import java.util.UUID;

public record JwtClaims(
        UUID identityUserId,
        UUID userId,
        UUID organizationId,
        String email,
        UserRole role,
        Instant issuedAt,
        Instant expiresAt
) {
}
