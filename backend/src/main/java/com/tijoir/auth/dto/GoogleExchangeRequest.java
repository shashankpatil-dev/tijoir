package com.tijoir.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record GoogleExchangeRequest(
        @NotBlank String idToken
) {
}
