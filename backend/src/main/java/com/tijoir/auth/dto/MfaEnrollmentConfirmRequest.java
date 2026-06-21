package com.tijoir.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record MfaEnrollmentConfirmRequest(
        @NotBlank String challengeId,
        @NotBlank String code
) {
}
