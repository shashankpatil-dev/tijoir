package com.tijoir.auth.dto;

import com.tijoir.organization.UserRole;

import java.time.Instant;
import java.util.UUID;

public record UserSummary(
        UUID id,
        UUID identityUserId,
        UUID organizationId,
        String name,
        String email,
        UserRole role,
        boolean emailVerified,
        Instant createdAt
) {
}
