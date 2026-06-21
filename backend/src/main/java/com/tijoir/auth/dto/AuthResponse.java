package com.tijoir.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        Instant expiresAt,
        Instant refreshExpiresAt,
        UserSummary user,
        OrganizationSummary organization,
        Boolean mfaRequired,
        String mfaChallengeId,
        Instant mfaChallengeExpiresAt
) {
}
