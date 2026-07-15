package com.tijoir.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GoogleRegisterRequest(
        @NotBlank String idToken,
        @NotBlank @Size(max = 255) String organizationName
) {
}
