package com.tijoir.auth.dto;

public record GoogleExchangeResponse(
        boolean needsOrganization,
        AuthResponse session
) {
}
