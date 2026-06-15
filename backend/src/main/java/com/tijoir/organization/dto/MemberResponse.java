package com.tijoir.organization.dto;

import com.tijoir.organization.UserRole;

import java.time.Instant;
import java.util.UUID;

public record MemberResponse(
        UUID id,
        String name,
        String email,
        UserRole role,
        boolean emailVerified,
        Instant createdAt
) {
}
