package com.tijoir.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record MfaDisableRequest(
        @NotBlank String password,
        @NotBlank String code
) {
}
