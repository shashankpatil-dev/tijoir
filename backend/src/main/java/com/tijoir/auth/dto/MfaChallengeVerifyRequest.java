package com.tijoir.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record MfaChallengeVerifyRequest(
        @NotBlank String challengeId,
        @NotBlank String code
) {
}
