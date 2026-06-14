package com.tijoir.secret.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RotateSecretRequest(
        @NotBlank @Size(max = 10000) String value
) {
}
