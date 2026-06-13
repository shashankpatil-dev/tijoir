package com.tijoir.auth.dto;

public record VerificationResponse(
        boolean verified,
        String message
) {
}

