package com.tijoir.organization.dto;

import com.tijoir.organization.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record CreateInviteRequest(
        @NotBlank @Email String email,
        @NotNull UserRole role,
        Instant expiresAt
) {
}
