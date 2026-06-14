package com.tijoir.secret.dto;

import com.tijoir.secret.SecretType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateSecretRequest(
        @NotBlank @Size(max = 255) String name,
        @NotNull SecretType type,
        @Size(max = 2000) String description,
        @NotBlank @Size(max = 10000) String value
) {
}
