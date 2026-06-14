package com.tijoir.secret.dto;

import com.tijoir.secret.SecretType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record GenerateSecretRequest(
        @NotNull SecretType type,
        @Min(8) @Max(256) Integer length
) {
}
