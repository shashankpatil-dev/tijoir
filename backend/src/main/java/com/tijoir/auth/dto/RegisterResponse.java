package com.tijoir.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record RegisterResponse(
        AuthResponse auth,
        boolean verificationRequired,
        boolean verificationEmailRequested,
        String emailVerificationToken,
        Instant emailVerificationExpiresAt
) {
}
