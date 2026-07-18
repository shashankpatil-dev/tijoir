package com.tijoir.auth.dto;

import com.tijoir.organization.UserRole;

import java.time.Instant;
import java.util.UUID;

public record WorkspaceMembershipSummary(
        UUID organizationId,
        UUID userId,
        String organizationName,
        String organizationSlug,
        String organizationEmail,
        UserRole role,
        boolean active,
        Instant joinedAt
) {
}
