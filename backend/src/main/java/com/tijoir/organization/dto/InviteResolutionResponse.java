package com.tijoir.organization.dto;

import com.tijoir.organization.OrganizationInviteStatus;
import com.tijoir.organization.UserRole;

import java.time.Instant;
import java.util.UUID;

public record InviteResolutionResponse(
        UUID organizationId,
        String organizationName,
        String organizationSlug,
        String invitedEmail,
        UserRole role,
        OrganizationInviteStatus status,
        Instant expiresAt,
        boolean existingAccount,
        boolean existingAccountVerified
) {
}
